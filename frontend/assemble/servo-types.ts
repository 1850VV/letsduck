import type { Actor, Step } from './types.js';
export interface ServoBinding extends Record<string, unknown> {
    id: number;
    actorId: string;
    role: string;
    status: string;
    installedAt?: string;
}
export interface ResolvedBinding extends ServoBinding {
    stepIndex: number;
    installationIndex: number;
}
export interface ServoMapping {
    version: string;
    bindings: ResolvedBinding[];
    byId: Map<number, ResolvedBinding>;
    steps: Step[];
}
export type PickState = 'available' | 'picked' | 'installed';
export interface Lead extends Record<string, unknown> {
    key: string;
    sourceStatus: string;
    cableClass: string;
    lengthMm: number;
    to: string;
}
export interface LeadCatalog extends Record<string, unknown> {
    requirements: Record<string, {
        connections: Lead[] | null;
    }>;
    reportedRequirement?: {
        servosRequiringLongLead: number;
    };
}
export interface PreparationRecord extends Record<string, unknown> {
    id: number;
    state: PickState;
    preparedLeads?: string[];
}
export interface Profile extends Record<string, unknown> {
    kp: number;
    kd: number;
    name?: string;
}
export interface SetupRecord extends Record<string, unknown> {
    id: number;
    state?: string;
    mapVersion?: string;
    profile?: Profile | null;
    readback?: Record<string, unknown> | null;
    sourceId?: number | null;
    oldIdAbsent?: boolean;
    reviewReason?: string;
    midEvidence?: string;
}
export interface SetupUiState extends Record<string, unknown> {
    phase: string;
    records: SetupRecord[];
    message?: string;
    currentId?: number | null;
    targetId?: number | null | undefined;
    activeTarget?: number | null;
    queuedTarget?: number | null;
    online?: boolean;
    running?: boolean;
    shutdownAt?: number | null;
    profile?: Profile | null;
    telemetry?: {
        known: boolean;
        ids: number[];
        readings?: Record<string, Record<string, unknown>>;
        observedAt?: number | null;
    };
    inspection?: {
        id: number;
        status: string;
        observedAt?: number | null;
        readback?: Record<string, unknown> | null;
    } | null;
    scan?: {
        active: boolean;
        checked: number;
        total: number;
    };
}
export function record(value: unknown): Record<string, unknown> { if (!value || typeof value !== 'object' || Array.isArray(value))
    throw Error('数据格式不正确'); return value as Record<string, unknown>; }
export function finite(value: unknown): number { if (typeof value !== 'number' || !Number.isFinite(value))
    throw Error('数值格式不正确'); return value; }
function text(value: unknown): string { if (typeof value !== 'string')
    throw Error('文本格式不正确'); return value; }
function strings(value: unknown): string[] { if (!Array.isArray(value))
    throw Error('列表格式不正确'); return value.map(text); }
function profile(value: unknown): Profile { const r = record(value); return { ...r, kp: finite(r.kp), kd: finite(r.kd), ...(r.name === undefined ? {} : { name: text(r.name) }) }; }
export const errorMessage = (error: unknown) => error instanceof Error ? error.message : String(error);
export function parseBindings(value: unknown): {
    version: string;
    bindings: ServoBinding[];
} { const r = record(value); if (!Array.isArray(r.bindings))
    throw Error('舵机映射与模型不一致'); return { ...r, version: text(r.version), bindings: r.bindings.map(value => { const b = record(value); return { ...b, id: finite(b.id), actorId: text(b.actorId), role: text(b.role), status: text(b.status), ...(b.installedAt === undefined ? {} : { installedAt: text(b.installedAt) }) }; }) }; }
export function parsePreparationRecords(value: unknown): PreparationRecord[] { if (!Array.isArray(value))
    throw Error('取件记录格式不正确'); return value.map(value => { const r = record(value), state = r.state; if (state !== 'available' && state !== 'picked' && state !== 'installed')
    throw Error('取件记录格式不正确'); return { ...r, id: finite(r.id), state, ...(r.preparedLeads === undefined ? {} : { preparedLeads: strings(r.preparedLeads) }) }; }); }
export function parseLeadCatalog(value: unknown): LeadCatalog { const r = record(value), requirements: LeadCatalog['requirements'] = {}; for (const [id, value] of Object.entries(record(r.requirements))) {
    const v = record(value), connections = v.connections;
    if (connections !== null && !Array.isArray(connections))
        throw Error('线材要求格式不正确');
    requirements[id] = { ...v, connections: connections === null ? null : connections.map(value => { const c = record(value); return { ...c, key: text(c.key), sourceStatus: text(c.sourceStatus), cableClass: text(c.cableClass), lengthMm: finite(c.lengthMm), to: text(c.to) }; }) };
} return { ...r, requirements, ...(r.reportedRequirement === undefined ? {} : { reportedRequirement: { ...record(r.reportedRequirement), servosRequiringLongLead: finite(record(r.reportedRequirement).servosRequiringLongLead) } }) }; }
export function parseSetupRecords(value: unknown): SetupRecord[] { if (!Array.isArray(value))
    throw Error('记录格式不正确'); return value.map(value => { const r = record(value), out: SetupRecord = { ...r, id: finite(r.id) }; for (const key of ['state', 'mapVersion', 'reviewReason', 'midEvidence'] as const)
    if (r[key] !== undefined)
        out[key] = text(r[key]); if (r.profile !== undefined)
    out.profile = r.profile === null ? null : profile(r.profile); if (r.readback !== undefined)
    out.readback = r.readback === null ? null : record(r.readback); if (r.sourceId !== undefined)
    out.sourceId = r.sourceId === null ? null : finite(r.sourceId); if (r.oldIdAbsent !== undefined) {
    if (typeof r.oldIdAbsent !== 'boolean')
        throw Error('记录格式不正确');
    out.oldIdAbsent = r.oldIdAbsent;
} return out; }); }
export function parseSetupState(value: unknown): SetupUiState { const r = record(value), out: SetupUiState = { ...r, phase: text(r.phase), records: parseSetupRecords(r.records) }; for (const key of ['currentId', 'targetId', 'activeTarget', 'queuedTarget', 'shutdownAt'] as const)
    if (r[key] !== undefined)
        out[key] = r[key] === null ? null : finite(r[key]); for (const key of ['online', 'running'] as const)
    if (r[key] !== undefined) {
        if (typeof r[key] !== 'boolean')
            throw Error('状态格式不正确');
        out[key] = r[key];
    } if (r.message !== undefined)
    out.message = text(r.message); if (r.profile !== undefined)
    out.profile = r.profile === null ? null : profile(r.profile); if (r.telemetry !== undefined) {
    const t = record(r.telemetry);
    if (!Array.isArray(t.ids) || typeof t.known !== 'boolean')
        throw Error('状态格式不正确');
    const readings: Record<string, Record<string, unknown>> = {};
    if (t.readings !== undefined)
        for (const [id, value] of Object.entries(record(t.readings)))
            readings[id] = record(value);
    out.telemetry = { ...t, known: t.known, ids: t.ids.map(finite), readings, ...(t.observedAt === undefined ? {} : { observedAt: t.observedAt === null ? null : finite(t.observedAt) }) };
} if (r.inspection !== undefined) {
    if (r.inspection === null)
        out.inspection = null;
    else {
        const i = record(r.inspection);
        out.inspection = { ...i, id: finite(i.id), status: text(i.status), ...(i.observedAt === undefined ? {} : { observedAt: i.observedAt === null ? null : finite(i.observedAt) }), ...(i.readback === undefined ? {} : { readback: i.readback === null ? null : record(i.readback) }) };
    }
} if (r.scan !== undefined) {
    const s = record(r.scan);
    if (typeof s.active !== 'boolean')
        throw Error('状态格式不正确');
    out.scan = { ...s, active: s.active, checked: finite(s.checked), total: finite(s.total) };
} return out; }
export type ServoMapContext = {
    actors: Record<string, Actor>;
    steps: Step[];
};
export interface PreparationSlot extends ResolvedBinding {
    index: number;
    row: number;
    column: number;
    state: PickState;
    leads: Lead[];
    leadKnown: boolean;
    leadLabel: string;
    prepared: boolean;
}
export type SetupStatusKind = 'working' | 'verified' | 'review' | 'pending';
export interface SetupItem {
    id: number;
    status: SetupStatusKind;
    record: SetupRecord | undefined;
    online: boolean;
    canResume: boolean;
}
