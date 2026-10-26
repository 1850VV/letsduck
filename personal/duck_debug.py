"""Personal debug window: the identified UNO Q runtime, with explicit writes only.

The existing setup worker and this window share the same physical-bus lock.
Readiness uses the existing board-scoped records; online state uses fresh telemetry.
"""
import copy
import math
import threading
import time
from datetime import datetime, timezone
from servo_setup import IDS, MAP_VERSION, SetupError


class DebugError(ValueError):
    def __init__(self, message, **details):
        super().__init__(message)
        self.details = details


def integer(value, lo, hi, name):
    if type(value) is not int or not lo <= value <= hi:
        raise DebugError('%s 需要 %s–%s 的整数' % (name, lo, hi))
    return value


def number(value, lo, hi, name):
    if type(value) not in (int, float) or not math.isfinite(value) or not lo <= value <= hi:
        raise DebugError('%s 超出范围 %s–%s' % (name, lo, hi))
    return value


def vector(value, bounds, name):
    if not isinstance(value, list) or len(value) != len(bounds):
        raise DebugError(name + ' 格式不对')
    return [number(v, *bounds[i], name) for i, v in enumerate(value)]


class DuckDebug:
    def __init__(self, store, setup):
        self.store, self.setup, self.runtime = store, setup, setup.runtime
        self.board = None
        self.readbacks = {}  # only individually addressed reads, with monotonic expiry
        self.held = set()
        self.pending_readback = set()
        self.owned = False
        self.calibrating = False
        self.scan = dict(active=False, checked=0, total=254, found=[], stopped=False, error='')
        self.scan_stop = threading.Event()
        self.scan_worker = None

    def connect(self):
        board = self.runtime.connect()
        if self.board and self.board != board:
            self.readbacks.clear();self.held.clear();self.pending_readback.clear()
        self.board = board
        return self.board

    def request(self, method, path, body=None):
        try:
            self.connect()
            result = self.runtime.request(method, path, body)
        except (SetupError, OSError, TimeoutError, ValueError) as exc:
            raise DebugError(str(exc) or '控制器无响应；写入结果请重新读回复核') from exc
        if not isinstance(result, dict):
            raise DebugError('控制器返回格式异常')
        if method == 'POST':
            expected = None
            if path == '/api/mode': expected = {'mode':body['mode']}
            elif path in ('/api/servo/enter','/api/cal/enter'): expected = {'mode':'servo_debug' if '/servo/' in path else 'calibrate'}
            elif path in ('/api/servo/exit','/api/cal/exit'): expected = {'mode':'shadow'}
            elif path in ('/api/roller','/api/action-scale','/api/filter','/api/imu-filter'): expected = body
            if expected is not None:
                if any(result.get(k) != v for k,v in expected.items()):
                    raise DebugError('控制器回显与请求不一致', reply=result)
                result = dict(result, ok=True)
            elif result.get('ok') is not True:
                raise DebugError('控制器未确认操作成功', reply=result)
        return result

    @staticmethod
    def fresh(status):
        age = status.get('feedback_age_ms')
        return type(age) in (int, float) and math.isfinite(age) and 0 <= age < 500

    def numbering(self):
        records = self.store.servo_records(self.board)
        verified, review = [], []
        for record in records:
            sid = record.get('id')
            if sid not in IDS:
                continue
            r, p = record.get('readback') or {}, record.get('profile') or {}
            valid = (record.get('state') == 'verified' and record.get('mapVersion') == MAP_VERSION
                     and record.get('verifiedAt') and r.get('ok') is True and r.get('target_id') == sid
                     and all(type(r.get(k)) is int and r[k] == p.get(k) for k in ('kp', 'kd')))
            if valid:
                verified.append(sid)
            else:
                review.append(sid)
        return dict(board=self.board, mapVersion=MAP_VERSION, ready=set(verified) == set(IDS), expectedIds=list(IDS),
                    verifiedIds=sorted(set(verified)), missingIds=[i for i in IDS if i not in verified],
                    reviewIds=sorted(set(review)), records=records)

    def status(self):
        error, status = '', {}
        try:
            with self.setup.io_lock:
                status = self.request('GET', '/api/status')
            connected = True
        except DebugError as exc:
            connected, error = False, str(exc)
        fresh = connected and self.fresh(status)
        active = set(status.get('servo_ids', [])) if fresh else set()
        active = {i for i in active if type(i) is int and 0 <= i <= 253}
        now = time.monotonic()
        if fresh and status.get('mode') == 'servo_debug':
            active.update(i for i, r in self.readbacks.items() if now-r['at'] < 2)
        devices = []
        records = {r['id']: r for r in self.store.servo_records(self.board)} if self.board else {}
        for sid in sorted(set(IDS) | active | set(self.readbacks)):
            index = IDS.index(sid) if sid in IDS else None
            recent = self.readbacks.get(sid)
            live = recent and now-recent['at'] < 2 and sid in active
            read = recent['reply'] if recent else {}
            saved = records.get(sid, {}).get('readback', {})
            pos = read.get('raw_pos') if live else None
            if sid in active and index is not None and status.get('raw_mask', 0) & (1 << index):
                raw = status.get('raw_pos') or []
                pos = raw[index] if index < len(raw) else pos
            devices.append(dict(uid='servo-%s' % sid, id=sid, online=sid in active,
                                pos=pos if sid in active else None, kp=read.get('kp', saved.get('kp')),
                                kd=read.get('kd', saved.get('kd')), parametersLive=bool(recent),
                                held=sid in self.held if status.get('mode') == 'calibrate' else bool(sid in active and status.get('enabled')),
                                readbackPending=sid in self.pending_readback or sid in active and pos is None))
        downstream = fresh and (bool(active) or status.get('imu_ok') is True)
        return dict(connected=connected, board=self.board, transport='usb', status=status, error=error,
                    onlineIds=sorted(active), devices=devices, numbering=self.numbering(),
                    boards=dict(arduino=dict(connected=bool(fresh)), expansion=dict(connected=bool(downstream))),
                    scan=copy.deepcopy(self.scan))

    def claim(self):
        # Only explicit actions take ownership. The old observer enters/exits debug mode.
        self.setup.write_requested = True
        self.setup.pause()
        self.setup.write_requested = True
        if getattr(self.setup, 'worker', None) and self.setup.worker.is_alive():
            raise DebugError('舵机准备任务尚未停止，请稍后再试')
        with self.setup.io_lock:
            self.connect()
        self.owned = True

    def enter_debug(self):
        status = self.request('GET', '/api/status')
        if not self.fresh(status):
            raise DebugError('MCU 反馈已过期，请检查主控连接')
        if status.get('enabled'):
            self.request('POST', '/api/mode', dict(mode='off'))
        self.request('POST', '/api/servo/enter', {})
        deadline = time.monotonic() + 1.5
        while True:
            status = self.request('GET', '/api/status')
            if self.fresh(status) and status.get('mode') == 'servo_debug' and status.get('mcu_servo_debug') is True:
                self.calibrating = False
                return
            if time.monotonic() >= deadline:
                raise DebugError('MCU 尚未进入单舵机模式')
            time.sleep(.05)

    def op(self, action, sid, allow_absent=False, **kwargs):
        reply = self.request('POST', '/api/servo', dict(action=action, target_id=sid, **kwargs)) if not allow_absent else self.ping(sid)
        expected = {'set_id':3,'set_gains':5,'read':6,'reset_mid':8,'torque_off':0,'jog':11}
        if reply.get('target_id') != sid or reply.get('ok') is not True or reply.get('op') != expected.get(action):
            raise DebugError('舵机读写回执编号或结果不匹配', reply=reply)
        return reply

    def ping(self, sid):
        # A negative PING is a normal reply, unlike an uncertain transport failure.
        try:
            reply = self.runtime.request('POST', '/api/servo', dict(action='ping', target_id=sid))
        except (SetupError, OSError, TimeoutError, ValueError) as exc:
            raise DebugError('PING 未收到可靠回执，请重新扫描') from exc
        if not isinstance(reply, dict) or reply.get('target_id') != sid or reply.get('op') != 7 or type(reply.get('ok')) is not bool:
            raise DebugError('PING 回执不匹配')
        return reply

    def read(self, sid, verify=True):
        reply = self.op('read', sid)
        if reply.get('op') != 6 or any(type(reply.get(k)) is not int or not 0 <= reply[k] <= hi for k, hi in [('raw_pos',4095),('kp',255),('kd',255)]):
            raise DebugError('舵机参数读回不完整', reply=reply)
        self.readbacks[sid] = dict(reply=reply, at=time.monotonic())
        self.pending_readback.discard(sid)
        if verify:
            previous = next((r for r in self.store.servo_records(self.board) if r['id'] == sid), {})
            self.store.save_servo_record(self.board, dict(previous, id=sid, sourceId=sid, state='verified',
                mapVersion=MAP_VERSION, profile={k:reply[k] for k in ('kp','kd')}, readback=reply,
                verifiedAt=datetime.now(timezone.utc).isoformat(), midEvidence=previous.get('midEvidence','existing'), reviewReason=''))
        return reply

    def invalidate(self, ids, reason):
        existing = {r['id']:r for r in self.store.servo_records(self.board)}
        for sid in set(ids):
            self.readbacks.pop(sid, None)
            self.store.save_servo_record(self.board, dict(existing.get(sid, {}), id=sid, state='review',
                                                        mapVersion=MAP_VERSION, reviewReason=reason))

    def rename(self, old, new, gains):
        self.op('set_id', old, new_id=new)
        read = self.read(new, verify=False)
        if any(read[k] != gains[k] for k in ('kp', 'kd')) or self.ping(old)['ok']:
            raise DebugError('改号后的参数或旧编号缺席校验未通过')
        self.readbacks.pop(old, None)
        self.held.discard(old)
        return read

    def remap(self, plan):
        sources = {p['fromId'] for p in plan}
        original = {i:self.read(i, verify=False) for i in sources}
        for p in plan:
            if p['toId'] not in sources and self.ping(p['toId'])['ok']:
                raise DebugError('ID%s 已被其他在线舵机使用' % p['toId'])
        pending = [dict(current=p['fromId'], target=p['toId'], original=p['fromId']) for p in plan if p['fromId'] != p['toId']]
        all_ids = {i for p in plan if p['fromId'] != p['toId'] for i in (p['fromId'],p['toId'])}
        completed = []
        if pending:
            self.invalidate(all_ids, '改号尚未完成读回复核')
        try:
            while pending:
                occupied = {p['current'] for p in pending}
                move = next((p for p in pending if p['target'] not in occupied), None)
                if move is None:
                    temporary = next((i for i in range(253,-1,-1) if i not in all_ids and not self.ping(i)['ok']), None)
                    if temporary is None:
                        raise DebugError('没有可用的临时编号，未继续交换')
                    move = pending[0]
                    self.rename(move['current'], temporary, original[move['original']])
                    completed.append(dict(fromId=move['current'],toId=temporary))
                    move['current'] = temporary
                    continue
                self.rename(move['current'], move['target'], original[move['original']])
                completed.append(dict(fromId=move['current'],toId=move['target']))
                pending.remove(move)
            for p in plan:
                self.read(p['toId'])
        except DebugError as exc:
            raise DebugError(str(exc)+'；已停止，请重新扫描并复核当前编号', completed=completed, remaining=pending) from exc
        return dict(ok=True, completed=completed)

    def validate(self, body):
        a = body.get('action')
        allowed = {'read','inspect','parameters','remap','jog','torque-off','reset-mid','verify','scan','scan-stop',
                   'mode','command','roller','pick','roulade','action-scale','filter','imu-filter',
                   'protection','cal-enter','cal-heartbeat','cal-center','cal-exit','release','leave'}
        if a not in allowed:
            raise DebugError('未知调试操作')
        b = dict(body)
        if a in {'read','inspect','parameters','jog','torque-off','reset-mid','cal-center'}:
            integer(b.get('id'),0,253,'编号')
        if a == 'parameters':
            integer(b.get('new_id'),0,253,'新编号')
            for k in ('kp','kd'): integer(b.get(k),0,255,k)
        if a == 'jog':
            integer(b.get('delta'),-10,10,'微动步幅')
            if b['delta'] == 0: raise DebugError('微动步幅不能为零')
        if a == 'remap':
            plan=b.get('plan')
            if not isinstance(plan,list) or not plan or len(plan)>254: raise DebugError('请选择要改号的舵机')
            for p in plan:
                if not isinstance(p,dict): raise DebugError('改号计划格式不对')
                integer(p.get('fromId'),0,253,'原编号'); integer(p.get('toId'),0,253,'目标编号')
            if any(len({p[k] for p in plan}) != len(plan) for k in ('fromId','toId')): raise DebugError('原编号或目标编号重复')
        if a == 'mode' and b.get('mode') not in ('off','shadow','hold','policy'): raise DebugError('控制模式不对')
        if a == 'command':
            if not any(k in b for k in ('twist','head','mouth')): raise DebugError('缺少控制输入')
            if 'twist' in b: vector(b['twist'],[(-.4,.4),(-.3,.3),(-1,1)],'运动输入')
            if 'head' in b: vector(b['head'],[(-1,1)]*4,'头颈输入')
            if 'mouth' in b: number(b['mouth'],0,30,'鸭嘴角度')
        if a == 'roller' and type(b.get('enabled')) is not bool: raise DebugError('轮滑开关格式不对')
        if a == 'action-scale': number(b.get('scale'),0,2,'动作幅度')
        if a == 'filter':
            for k in ('leg','head'): number(b.get(k),0,.95,k)
        if a == 'imu-filter':
            if not any(k in b for k in ('gyro_alpha','gravity_tau_s')): raise DebugError('缺少滤波参数')
            if 'gyro_alpha' in b: number(b['gyro_alpha'],0,.95,'角速度平滑')
            if 'gravity_tau_s' in b: number(b['gravity_tau_s'],.01,2,'重力滤波')
        if a == 'protection':
            if ('enabled' in b) == ('current_a' in b): raise DebugError('保护开关和电流阈值请分别写入')
            if 'enabled' in b and type(b['enabled']) is not bool: raise DebugError('保护开关格式不对')
            if 'current_a' in b: number(b['current_a'],0,425.9775,'电流阈值')
        if a == 'cal-center' and b['id'] not in IDS: raise DebugError('该编号没有对应的校准关节')
        return a,b

    def action(self, body):
        a,b = self.validate(body)  # validate everything before touching controller
        if a == 'scan-stop':
            self.scan_stop.set()
            return dict(ok=True)
        if a in ('release','leave'):
            self.scan_stop.set()
            if a == 'release': self.claim()
            with self.setup.io_lock:
                if a == 'release':
                    result=self.request('POST','/api/mode',dict(mode='off'))
                elif not self.owned:
                    return dict(ok=True)
                else:
                    status=self.request('GET','/api/status')
                    path='/api/cal/exit' if self.calibrating else '/api/servo/exit' if status.get('mode')=='servo_debug' else '/api/command'
                    result=self.request('POST',path,dict(twist=[0,0,0]) if path=='/api/command' else {})
                self.calibrating=False;self.held.clear();self.owned=False
                # Preserve guard against the legacy auto-observer while control mode is retained.
                return result
        if self.scan['active']: raise DebugError('请先停止扫描')
        if a not in ('command','cal-heartbeat','inspect'): self.claim()
        with self.setup.io_lock:
            if a == 'inspect':
                if not self.owned or self.request('GET','/api/status').get('mode') != 'servo_debug':
                    raise DebugError('单舵机读取已暂停')
                return dict(ok=True,readback=self.read(b['id'],verify=False))
            if a in ('command','cal-heartbeat'):
                if not self.owned: raise DebugError('请先选择控制模式或开始校准')
                path='/api/command' if a=='command' else '/api/cal/heartbeat'
                keys=('twist','head','mouth') if a=='command' else ()
                return self.request('POST',path,{k:b[k] for k in keys if k in b})
            if a == 'mode':
                s=self.request('GET','/api/status')
                if b['mode'] in ('hold','policy') and s.get('mode') in ('servo_debug','calibrate'):
                    self.request('POST','/api/mode',dict(mode='shadow'))
                    s=self.request('GET','/api/status')
                if b['mode'] in ('hold','policy') and (not self.fresh(s) or s.get('control_ready') is not True):
                    raise DebugError('控制反馈尚未就绪；请检查 IMU 与 MCU')
                result=self.request('POST','/api/mode',dict(mode=b['mode']))
                self.calibrating=False;self.held.clear()
                return result
            paths={'roller':('/api/roller',('enabled',)), 'pick':('/api/pick',()), 'roulade':('/api/roulade',()),
                   'action-scale':('/api/action-scale',('scale',)), 'filter':('/api/filter',('leg','head')),
                   'imu-filter':('/api/imu-filter',('gyro_alpha','gravity_tau_s'))}
            if a in paths:
                path,keys=paths[a]
                return self.request('POST',path,{k:b[k] for k in keys if k in b})
            if a in ('cal-enter','cal-exit','cal-center'):
                path={'cal-enter':'enter','cal-exit':'exit','cal-center':'center'}[a]
                if a=='cal-center' and not self.calibrating: raise DebugError('请先开始校准')
                result=self.request('POST','/api/cal/'+path,dict(index=IDS.index(b['id'])) if a=='cal-center' else {})
                if a=='cal-center':
                    if result.get('id')!=b['id'] or result.get('index')!=IDS.index(b['id']) or result.get('hold_pos')!=2048:
                        raise DebugError('中位保持回执不匹配')
                    self.held.add(b['id']);self.readbacks.pop(b['id'],None)
                else:
                    self.calibrating=a=='cal-enter';self.held.clear()
                return result
            self.enter_debug()
            if a == 'scan': return self.start_scan()
            if a == 'verify':
                s=self.request('GET','/api/status')
                ids=set(s.get('servo_ids',[])) | {i for i,r in self.readbacks.items() if time.monotonic()-r['at']<2}
                for sid in sorted(ids): self.read(sid)
                return dict(ok=True,numbering=self.numbering())
            if a == 'read': return dict(ok=True,readback=self.read(b['id']))
            if a == 'remap': return self.remap(b['plan'])
            if a == 'parameters':
                sid,new=b['id'],b['new_id']
                current=self.read(sid,verify=False)
                if new!=sid and self.ping(new)['ok']: raise DebugError('目标编号已在线，请使用编号互换')
                self.invalidate([sid,new],'写入结果尚未读回复核')
                try:
                    if any(current[k]!=b[k] for k in ('kp','kd')): self.op('set_gains',sid,kp=b['kp'],kd=b['kd'])
                    if new!=sid: self.rename(sid,new,b)
                    result=self.read(new)
                    if any(result[k]!=b[k] for k in ('kp','kd')):
                        self.invalidate([new],'参数读回不一致');raise DebugError('KP/KD 读回与请求不一致')
                except DebugError as exc:
                    self.invalidate([sid,new],'写入未确认，请重新读取')
                    raise DebugError(str(exc)+'；未自动重试，请重新读取') from exc
                return dict(ok=True,readback=result)
            if a == 'protection':
                payload=dict(action='set_protection',protection_enabled=b['enabled']) if 'enabled' in b else dict(action='set_protection_current',current_a=b['current_a'])
                result=self.request('POST','/api/servo',payload)
                if result.get('target_id')!=254 or result.get('broadcast') is not True or result.get('op')!=(9 if 'enabled' in b else 10):
                    raise DebugError('保护广播回执不匹配')
                return dict(ok=True,reply=result,individuallyVerified=False)
            sid=b['id']
            if a == 'reset-mid':
                result=self.op('reset_mid',sid);self.readbacks.pop(sid,None);self.held.discard(sid);self.pending_readback.add(sid)
                return dict(ok=True,reply=result,readbackPending=True)
            if a == 'torque-off':
                result=self.op('torque_off',sid);self.held.discard(sid);return result
            if a == 'jog':
                delta=b['delta']
                current=self.read(sid,verify=False)
                if not 0 <= current['raw_pos']+delta <= 4095: raise DebugError('微动目标超出编码器范围')
                self.op('jog',sid,delta=delta)
                result=self.read(sid,verify=False);self.held.discard(sid)
                return dict(ok=True,readback=result)
        raise DebugError('操作未执行')

    def start_scan(self):
        self.scan_stop.clear()
        self.scan=dict(active=True,checked=0,total=254,found=[],stopped=False,error='')
        def run():
            try:
                for sid in range(254):
                    with self.setup.io_lock:
                        if self.scan_stop.is_set(): break
                        self.enter_debug()
                        if self.ping(sid)['ok']:
                            self.read(sid,verify=False);self.scan['found'].append(sid)
                        self.scan['checked']=sid+1
                    # Let waiting status/unload handlers use the existing bus lock between probes.
                    time.sleep(.001)
            except DebugError as exc:
                self.scan['error']=str(exc)
            finally:
                self.scan['stopped']=self.scan_stop.is_set();self.scan['active']=False
        self.scan_worker=threading.Thread(target=run,daemon=True,name='duck-debug-scan')
        self.scan_worker.start()
        return dict(ok=True)

    def close(self):
        self.scan_stop.set()
        if self.scan_worker: self.scan_worker.join(timeout=5)
        # Removing an unused view/server never writes a controller command.
