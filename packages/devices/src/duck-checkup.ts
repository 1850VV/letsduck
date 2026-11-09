/**
 * The 体检单: rules that turn one trip's board status stream into a verdict per stage and the physical action to take.
 * `CheckupMeter` is fed every status the recorder saves and keeps only running sums (no frames), so a trip of any
 * length costs a few kilobytes. `checkup()` grades the numbers.
 *
 * Pass lines were set on 2026-11-09 from the same duck: three walks that fell (11-07, before the chest and legs were
 * re-assembled) against three that did not (11-09), at vx 0.2. Only walking separated them: sideways roll ±9.5–10.8° vs
 * ±2.0–2.6°, leg tracking error 15.5–16° vs 4–6°, knee command swing 72–76° vs 29–37°. Standing checks looked the same
 * in both, so their lines only catch faults far outside what this duck shows when healthy.
 */
type JsonRecord = Record<string, unknown>;
const IDS = [10, 11, 12, 13, 14, 20, 21, 22, 23, 24, 30, 31, 32, 33, 34];
const LEGS = [11, 12, 13, 14, 21, 22, 23, 24], KNEES = [13, 23];
const LEG = LEGS.map(id => IDS.indexOf(id)), KNEE = KNEES.map(id => IDS.indexOf(id));
const MIRROR: [number, number][] = [[11, 21], [12, 22], [13, 23], [14, 24]];
const ROLL_BINS = 1200, ROLL_STEP = .1; // −60…60° in 0.1° steps
const WINDOW_S = 1.5;

/** What one trip measured. Plain numbers only, so it can be saved beside the recording and merged across sittings. */
export interface CheckupData {
  /** Servo ids the board reported missing for 3 readings in a row. */
  missing: number[];
  /** Mean pack voltage while standing, lowest while walking. */
  voltHold: number | null; voltWalkMin: number | null;
  /** The servo whose own voltage reads lowest against the others, and by how much (V, negative). */
  lowServo: { id: number; dev: number } | null;
  /** 'saturated': acceleration pinned at the range limit; 'frozen': gyro identical while frames advance; 'not-ok': board says so. */
  imuStuck: 'saturated' | 'frozen' | 'not-ok' | null;
  /** Largest mean gyro axis while still (deg/s), over stillS seconds. */
  gyroBias: number | null; stillS: number;
  /** Standing in hold: largest mean |angle − target| for a knee and for any other leg joint (deg) with their ids, mirrored L/R difference, tilt. */
  holdS: number; kneeErr: number | null; kneeId: number | null; legErr: number | null; legId: number | null; lrDiff: number | null; roll: number | null; pitch: number | null;
  /** Walking: seconds, roll half-span p95–p5 (deg), leg error RMS (deg), median knee command swing per 1.5 s (deg), mean inference rate. */
  walkS: number; sway: number | null; walkErr: number | null; kneeSwing: number | null; hz: number | null;
  /** Unix ms of each fall. (Which joint "went first" was tried and dropped: in the last 0.5 s every joint's error jumps together.) */
  falls: number[];
  roller: boolean;
}

const num = (v: unknown) => typeof v === 'number' && Number.isFinite(v) ? v : null;
const nums = (v: unknown, n: number) => Array.isArray(v) && v.length >= n && v.slice(0, n).every(x => typeof x === 'number' && Number.isFinite(x)) ? v as number[] : null;
const round = (v: number, d = 1) => Math.round(v * 10 ** d) / 10 ** d;
const DEG = 180 / Math.PI;

export class CheckupMeter {
  private missingRun = new Map<number, number>(); private missing = new Set<number>();
  private holdV = [0, 0]; private walkVMin = Infinity; private servoV = new Map<number, [number, number]>();
  private imuStuck: CheckupData['imuStuck'] = null; private saturatedS = 0; private frozenS = 0; private lastGyro = ''; private lastSeq: unknown = null;
  private still = [0, 0, 0]; private stillN = 0; private stillS = 0;
  private holdErr = new Array(15).fill(0) as number[]; private holdN = 0; private holdS = 0; private tilt = [0, 0];
  private walkS = 0; private rollHist = new Array(ROLL_BINS).fill(0) as number[]; private walkSq = 0; private walkSqN = 0;
  private hz = [0, 0]; private swings: number[] = []; private window = { s: 0, lo: [Infinity, Infinity], hi: [-Infinity, -Infinity] };
  private phase: unknown = null; private falls: number[] = [];
  private roller = false; private last = 0;

  /** One board status at Unix ms `now`. Returns true when the duck fell over in the walking model. */
  add(status: JsonRecord, now: number): boolean {
    const dt = this.last ? Math.min(1, Math.max(0, (now - this.last) / 1000)) : 0; this.last = now;
    const mode = status.mode, angles = nums(status.angles, 15), targets = nums(status.targets, 15), recovery = status.recovery as JsonRecord | undefined;
    const twist = nums(status.command, 3) ?? [0, 0, 0], roller = !!(status.roller as JsonRecord | undefined)?.enabled;
    const walking = mode === 'policy' && recovery?.phase === 'walk' && twist.some(v => v !== 0);
    if (walking && roller) this.roller = true;
    // 0 · servos missing for 3 readings in a row (a single blink during a fall does not count).
    const gone = new Set(Array.isArray(status.missing_joint_ids) ? status.missing_joint_ids.filter((id): id is number => typeof id === 'number') : []);
    for (const id of IDS) { const n = gone.has(id) ? (this.missingRun.get(id) ?? 0) + 1 : 0; this.missingRun.set(id, n); if (n >= 3) this.missing.add(id); }
    const volt = num(status.voltage_v);
    if (volt !== null && mode === 'hold') { this.holdV[0]! += volt; this.holdV[1]!++; }
    if (volt !== null && walking) this.walkVMin = Math.min(this.walkVMin, volt);
    const perServo = status.servo_voltage_v;
    if (perServo && typeof perServo === 'object') for (const [id, v] of Object.entries(perServo)) { const x = num(v); if (x !== null) { const s = this.servoV.get(Number(id)) ?? [0, 0]; s[0] += x; s[1]++; this.servoV.set(Number(id), s); } }
    // 3 · IMU: trust the readings, not the board's own imu_ok.
    const acc = nums(status.acc, 3), gyro = nums(status.gyro, 3), advanced = status.mcu_seq !== this.lastSeq; this.lastSeq = status.mcu_seq;
    if (status.imu_ok === false) this.imuStuck ??= 'not-ok';
    this.saturatedS = acc && acc.some(v => Math.abs(v) >= 19.5) ? this.saturatedS + dt : 0;
    if (this.saturatedS >= 1) this.imuStuck ??= 'saturated';
    if (gyro && advanced) { const key = gyro.join(); this.frozenS = key === this.lastGyro ? this.frozenS + dt : 0; this.lastGyro = key; if (this.frozenS >= 2) this.imuStuck ??= 'frozen'; }
    const gc = nums(status.gyro_corrected, 3), vel = nums(status.velocities, 15), motionless = !!vel && vel.every(v => Math.abs(v) < .5);
    if (gc && motionless && gc.every(v => Math.abs(v) < 3) && ['off', 'shadow', 'hold'].includes(String(mode))) { gc.forEach((v, i) => { this.still[i]! += v; }); this.stillN++; this.stillS += dt; }
    const g = nums(status.gravity, 3), roll = g ? Math.atan2(g[1]!, -g[2]!) * DEG : null, pitch = g ? Math.atan2(-g[0]!, -g[2]!) * DEG : null;
    // 4 · standing still in the default pose, upright on the floor.
    if (mode === 'hold' && status.pose !== true && angles && targets && motionless && g && g[2]! < -.9) {
      angles.forEach((a, i) => { this.holdErr[i]! += Math.abs(a - targets[i]!); }); this.holdN++; this.holdS += dt; this.tilt[0]! += roll!; this.tilt[1]! += pitch!;
    }
    // 5 / 6 · walking.
    if (walking && !roller && angles && targets) {
      this.walkS += dt;
      if (roll !== null) this.rollHist[Math.max(0, Math.min(ROLL_BINS - 1, Math.floor((roll + 60) / ROLL_STEP)))]!++;
      const err = LEG.map(i => angles[i]! - targets[i]!);
      for (const e of err) this.walkSq += e * e; this.walkSqN += err.length;
      const hz = num(status.inference_hz); if (hz !== null && hz > 0) { this.hz[0]! += hz; this.hz[1]!++; }
      const w = this.window; w.s += dt; KNEE.forEach((i, k) => { w.lo[k] = Math.min(w.lo[k]!, targets[i]!); w.hi[k] = Math.max(w.hi[k]!, targets[i]!); });
      if (w.s >= WINDOW_S) { this.swings.push((w.hi[0]! - w.lo[0]! + w.hi[1]! - w.lo[1]!) / 2); this.window = { s: 0, lo: [Infinity, Infinity], hi: [-Infinity, -Infinity] }; }
    } else if (!walking) { this.window = { s: 0, lo: [Infinity, Infinity], hi: [-Infinity, -Infinity] }; }
    // In the walk model the runtime's recovery leaves 'walk' for 'default_pose' when the duck tips over.
    const phase = mode === 'policy' ? recovery?.phase : null, fell = this.phase === 'walk' && phase === 'default_pose';
    this.phase = phase;
    if (fell) this.falls.push(now);
    return fell;
  }

  data(): CheckupData {
    const servo = [...this.servoV].map(([id, [s, n]]) => ({ id, v: s / n })), mean = servo.reduce((a, b) => a + b.v, 0) / (servo.length || 1);
    const low = servo.length > 1 ? servo.reduce((a, b) => b.v < a.v ? b : a) : null;
    const errs = this.holdN ? this.holdErr.map(s => s / this.holdN) : null;
    const leg = errs ? LEGS.filter(id => !KNEES.includes(id)).reduce((a, id) => errs[IDS.indexOf(id)]! > errs[IDS.indexOf(a)]! ? id : a) : null;
    const knee = errs ? KNEES.reduce((a, id) => errs[IDS.indexOf(id)]! > errs[IDS.indexOf(a)]! ? id : a) : null;
    const total = this.rollHist.reduce((a, b) => a + b, 0), pct = (p: number) => { let n = 0; for (let i = 0; i < ROLL_BINS; i++) { n += this.rollHist[i]!; if (n >= p * total) return -60 + (i + .5) * ROLL_STEP; } return 60; };
    const swings = [...this.swings].sort((a, b) => a - b), enough = this.walkS >= 3;
    return {
      missing: [...this.missing].sort((a, b) => a - b),
      voltHold: this.holdV[1] ? round(this.holdV[0]! / this.holdV[1]!, 2) : null, voltWalkMin: Number.isFinite(this.walkVMin) ? round(this.walkVMin, 2) : null,
      lowServo: low ? { id: low.id, dev: round(low.v - mean, 2) } : null,
      imuStuck: this.imuStuck,
      gyroBias: this.stillS >= 2 ? round(Math.max(...this.still.map(s => Math.abs(s / this.stillN))), 2) : null, stillS: round(this.stillS),
      holdS: round(this.holdS), kneeId: knee, legId: leg,
      kneeErr: errs ? round(errs[IDS.indexOf(knee!)]!) : null, legErr: errs ? round(errs[IDS.indexOf(leg!)]!) : null,
      lrDiff: errs ? round(Math.max(...MIRROR.map(([l, r]) => Math.abs(errs[IDS.indexOf(l)]! - errs[IDS.indexOf(r)]!)))) : null,
      roll: this.holdN ? round(this.tilt[0]! / this.holdN) : null, pitch: this.holdN ? round(this.tilt[1]! / this.holdN) : null,
      walkS: round(this.walkS), sway: enough && total ? round((pct(.95) - pct(.05)) / 2) : null,
      walkErr: enough && this.walkSqN ? round(Math.sqrt(this.walkSq / this.walkSqN)) : null,
      kneeSwing: enough && swings.length ? round(swings[Math.floor(swings.length / 2)]!) : null,
      hz: enough && this.hz[1] ? round(this.hz[0]! / this.hz[1]!) : null,
      falls: [...this.falls], roller: this.roller,
    };
  }
}

export type CheckGrade = 'good' | 'warn' | 'bad' | 'manual' | 'skip' | 'blocked';
export type CheckStage = 'power' | 'servo' | 'zero' | 'imu' | 'stand' | 'structure' | 'walk';
/** A failed rule. The page words it and names the physical action; values carry what to show. */
export interface Problem { id: string; grade: 'warn' | 'bad'; values: Record<string, number | string> }
export interface CheckRow { stage: CheckStage; grade: CheckGrade; problems: Problem[]; values: Record<string, number | string> }
export interface Checkup { rows: CheckRow[]; /** The first red (else yellow) problem, in stage order: what to do first. */ first: (Problem & { stage: CheckStage }) | null }

const worst = (problems: Problem[]): CheckGrade => problems.some(p => p.grade === 'bad') ? 'bad' : problems.length ? 'warn' : 'good';
const line = (value: number | null, warn: number, bad: number) => value === null ? null : value > bad ? 'bad' as const : value > warn ? 'warn' as const : null;

export function checkup(d: CheckupData): Checkup {
  const power: Problem[] = [], imu: Problem[] = [], stand: Problem[] = [], structure: Problem[] = [], walk: Problem[] = [];
  if (d.missing.length) power.push({ id: 'missing', grade: 'bad', values: { ids: d.missing.join(', ') } });
  const drop = d.voltHold !== null && d.voltWalkMin !== null ? round(d.voltHold - d.voltWalkMin, 2) : null;
  if (drop !== null && drop > .8) power.push({ id: 'volt-drop', grade: 'warn', values: { drop, volt: d.voltWalkMin! } });
  if (d.lowServo && d.lowServo.dev < -.3) power.push({ id: 'low-servo', grade: 'warn', values: { id: d.lowServo.id, dev: -d.lowServo.dev } });
  if (d.imuStuck) imu.push({ id: 'imu-stuck', grade: 'bad', values: { how: d.imuStuck } });
  const bias = line(d.gyroBias, 2, 5); if (bias) imu.push({ id: 'gyro-bias', grade: bias, values: { bias: d.gyroBias!, line: 2 } });
  if (d.holdS >= 2) {
    // Knees carry the body and sag ~2° when healthy; the other leg joints sit within 0.7°. Standing never tells a good
    // walk from a bad one on this duck, and how the feet were set down moves these numbers too, so they stay yellow hints.
    const knee = d.kneeErr! / 3.5 >= d.legErr! / 1.5, err = knee ? d.kneeErr! : d.legErr!, at = knee ? 3.5 : 1.5;
    if (err > at) stand.push({ id: 'stand-err', grade: 'warn', values: { id: (knee ? d.kneeId : d.legId)!, err, line: at } });
    if (d.lrDiff !== null && d.lrDiff > 1.5) stand.push({ id: 'stand-lr', grade: 'warn', values: { diff: d.lrDiff } });
    const tilt = Math.max(Math.abs(d.roll ?? 0), Math.abs(d.pitch ?? 0)); if (tilt > 5) stand.push({ id: 'stand-tilt', grade: 'warn', values: { tilt: round(tilt) } });
  }
  const walked = d.walkS >= 3 && d.sway !== null;
  if (walked) {
    const sway = line(d.sway, 3.5, 5); if (sway) structure.push({ id: 'sway', grade: sway, values: { sway: d.sway!, line: 3.5 } });
    const err = line(d.walkErr, 8, 12); if (err) walk.push({ id: 'walk-err', grade: err, values: { err: d.walkErr!, line: 8 } });
    const swing = line(d.kneeSwing, 50, 60); if (swing) walk.push({ id: 'knee-swing', grade: swing, values: { swing: d.kneeSwing!, line: 50 } });
    if (d.hz !== null && d.hz < 40) walk.push({ id: 'slow-board', grade: 'warn', values: { hz: d.hz } });
  }
  if (d.falls.length) walk.push({ id: 'falls', grade: 'warn', values: { falls: d.falls.length } });
  // A missing servo or a dead IMU makes every later reading meaningless.
  const blocked = d.missing.length > 0 || d.imuStuck !== null;
  const row = (stage: CheckStage, problems: Problem[], values: Record<string, number | string>, measured: boolean): CheckRow =>
    ({ stage, grade: !measured ? 'skip' : worst(problems), problems, values });
  const later = (r: CheckRow): CheckRow => blocked && r.grade !== 'skip' ? { ...r, grade: 'blocked', problems: [] } : r;
  const rows: CheckRow[] = [
    row('power', power, { online: 15 - d.missing.length, ...((d.voltWalkMin ?? d.voltHold) !== null ? { volt: (d.voltWalkMin ?? d.voltHold)! } : {}), ...(d.voltWalkMin !== null ? { walking: 1 } : {}) }, d.voltHold !== null || d.voltWalkMin !== null || d.missing.length > 0 || d.lowServo !== null),
    { stage: 'servo', grade: 'manual', problems: [], values: {} },
    { stage: 'zero', grade: 'manual', problems: [], values: {} },
    row('imu', imu, d.gyroBias !== null ? { bias: d.gyroBias } : {}, d.imuStuck !== null || d.gyroBias !== null || d.stillS > 0 || d.holdS > 0 || d.walkS > 0),
    later(row('stand', stand, d.kneeErr !== null ? { err: Math.max(d.kneeErr, d.legErr!) } : {}, d.holdS >= 2)),
    later(row('structure', structure, d.sway !== null ? { sway: d.sway } : {}, walked)),
    later(row('walk', walk, { ...(d.walkErr !== null ? { err: d.walkErr } : {}), ...(d.kneeSwing !== null ? { swing: d.kneeSwing } : {}), ...(d.roller ? { roller: 1 } : {}) }, walked || d.falls.length > 0)),
  ];
  const live = rows.filter(r => r.grade === 'bad' || r.grade === 'warn');
  const pick = (g: 'bad' | 'warn') => { for (const r of live) { const p = r.problems.find(p => p.grade === g); if (p) return { ...p, stage: r.stage }; } return null; };
  return { rows, first: pick('bad') ?? pick('warn') };
}

/** One power-on of the duck: its sittings merged and graded. */
export interface Trip { boot: number | null; start: number; end: number; files: string[]; actions: Record<string, number>; data: CheckupData; checkup: Checkup }

/** Several sittings of one trip (the page was closed and reopened while the duck stayed on): per measurement keep the one with more data. */
export function mergeCheckup(parts: CheckupData[]): CheckupData {
  const by = (key: keyof CheckupData) => parts.reduce((a, b) => (Number(b[key]) || 0) > (Number(a[key]) || 0) ? b : a);
  const walk = by('walkS'), hold = by('holdS'), still = by('stillS'), first = parts[0]!;
  const minOf = (vals: (number | null)[]) => { const v = vals.filter((x): x is number => x !== null); return v.length ? Math.min(...v) : null; };
  return {
    ...first,
    missing: [...new Set(parts.flatMap(p => p.missing))].sort((a, b) => a - b),
    voltHold: hold.voltHold ?? first.voltHold, voltWalkMin: minOf(parts.map(p => p.voltWalkMin)),
    lowServo: parts.map(p => p.lowServo).filter(Boolean).sort((a, b) => a!.dev - b!.dev)[0] ?? null,
    imuStuck: parts.find(p => p.imuStuck)?.imuStuck ?? null,
    gyroBias: still.gyroBias, stillS: parts.reduce((a, p) => a + p.stillS, 0),
    holdS: hold.holdS, kneeErr: hold.kneeErr, kneeId: hold.kneeId, legErr: hold.legErr, legId: hold.legId, lrDiff: hold.lrDiff, roll: hold.roll, pitch: hold.pitch,
    walkS: walk.walkS, sway: walk.sway, walkErr: walk.walkErr, kneeSwing: walk.kneeSwing, hz: walk.hz,
    falls: parts.flatMap(p => p.falls), roller: parts.some(p => p.roller),
  };
}
