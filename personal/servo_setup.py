"""UNO Q servo setup, using the installed official ADB and Duck runtime, without a daemon.

Only ID/gain readbacks are verification. Reset Mid ACK is recorded separately; the runtime's
constant center_pos field cannot establish mechanical zero. No motion API is exposed here.
"""
import copy
import json
import os
import shutil
import subprocess
import threading
import time
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import ProxyHandler, Request, build_opener

BINDINGS = json.loads((Path(__file__).resolve().parents[1] / 'frontend/assemble/servo-map.json').read_text())
IDS = tuple(b['id'] for b in BINDINGS['bindings'])
MAP_VERSION = BINDINGS['version']


class SetupError(ValueError):
    pass


class Offline(SetupError):
    pass


class Cancelled(SetupError):
    pass


class Inputs(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.values = {}
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'input' and a.get('id') in ('kp', 'kd'):
            self.values[a['id']] = a.get('value')


def profile_for(status, html):
    values = Inputs(html).values
    pair = (values.get('kp'), values.get('kd'))
    # These are observed runtime-v2 UI profiles, not universal servo defaults.
    if status.get('servo_scan_version') != 2 or pair not in (('5', '10'), ('5', '20')):
        raise SetupError('无法匹配运行端配置档。请核对 Duck OS 与舵机设置页面，当前保持只读。')
    return {'name': 'Duck Runtime v2 · KP %s / KD %s' % pair, 'kp': int(pair[0]), 'kd': int(pair[1])}


class AdbRuntime:
    def __init__(self):
        self.serial = None
        self.port = None
        self.opener = build_opener(ProxyHandler({}))

    @staticmethod
    def executable():
        candidates = [os.environ.get('DUCK_ADB'), shutil.which('adb')]
        candidates += sorted((Path.home() / 'Library/Arduino15/packages/arduino/tools/adb').glob('*/adb'), reverse=True)
        candidates += sorted((Path.home() / '.arduino15/packages/arduino/tools/adb').glob('*/adb'), reverse=True)
        for candidate in candidates:
            if candidate and Path(candidate).is_file() and os.access(candidate, os.X_OK):
                return str(candidate)
        raise Offline('没有找到 ADB。请先安装 Arduino App Lab，完成 UNO Q 的首次设置。')

    def command(self, *args):
        try:
            result = subprocess.run([self.executable(), *args], capture_output=True, text=True, timeout=8)
        except (OSError, subprocess.TimeoutExpired) as exc:
            raise Offline('USB 连接没有响应，请重新插接 UNO Q。') from exc
        if result.returncode:
            raise Offline('ADB 未连接到 UNO Q，请检查 USB 线和板卡供电。')
        return result.stdout.strip()

    def connect(self):
        if self.port:
            return self.serial
        devices = self.command('devices', '-l').splitlines()[1:]
        boards = []
        for line in devices:
            words = line.split()
            if len(words) >= 2 and words[1] == 'device':
                serial = words[0]
                try:
                    model = self.command('-s', serial, 'shell', 'cat', '/sys/firmware/devicetree/base/model')
                except Offline:
                    continue
                if self.is_unoq(model):
                    boards.append(serial)
        if len(boards) != 1:
            raise Offline('请只连接一块 UNO Q。' if boards else '尚未发现 UNO Q，请连接 USB 并等待板子启动。')
        self.serial = boards[0]
        port = self.command('-s', self.serial, 'forward', 'tcp:0', 'tcp:9527')
        if not port.isdigit() or not 0 < int(port) < 65536:
            raise Offline('无法建立 UNO Q 的本机连接。')
        self.port = int(port)
        return self.serial

    @staticmethod
    def is_unoq(model):
        return model.replace('\x00', '').strip().casefold() in ('arduino unoq', 'arduino uno q')

    def request(self, method, path, body=None):
        self.connect()
        data = json.dumps(body).encode() if body is not None else None
        request = Request('http://127.0.0.1:%d%s' % (self.port, path), data=data, method=method,
                          headers={'Content-Type': 'application/json'} if data is not None else {})
        try:
            with self.opener.open(request, timeout=4) as response:
                raw = response.read(2_000_000).decode()
                return raw if path == '/servo.html' else json.loads(raw)
        except HTTPError as exc:
            raise SetupError('运行端拒绝了当前操作，请重新检测连接与参数。') from exc
        except (URLError, OSError, ValueError) as exc:
            self.close()
            raise Offline('UNO Q 或运行应用暂未就绪，正在等待重新连接。') from exc

    def halt(self):
        # Called only after connect() identified the board via its device tree. Never runs on the Mac.
        serial = self.connect()
        model = self.command('-s', serial, 'shell', 'cat', '/sys/firmware/devicetree/base/model')
        if not self.is_unoq(model):
            raise SetupError('无法确认板卡身份，未发送停机命令。')
        self.command('-s', serial, 'shell', 'sudo', '-n', 'halt')
        self.close()

    def close(self):
        if self.port:
            try:
                self.command('-s', self.serial, 'forward', '--remove', 'tcp:%d' % self.port)
            except SetupError:
                pass
        self.port = None


class ServoSetup:
    def __init__(self, store, runtime=None):
        self.store = store
        self.runtime = runtime or AdbRuntime()
        self.board = None
        self.profile = None
        self.phase = 'idle'
        self.message = ''
        self.progress = 0
        self.current = None
        self.online = False
        self.running = False
        self.worker = None
        self.stop = threading.Event()
        self.last_heartbeat = 0
        self.shutdown_at = None

    def snapshot(self):
        records = self.store.servo_records(self.board)
        assigned = {r['id'] for r in records if r['state'] in ('verified', 'reported')}
        return copy.deepcopy(dict(phase=self.phase, message=self.message, progress=self.progress,
                                  currentId=self.current, targetId=next((i for i in IDS if i not in assigned), None),
                                  board=self.board, online=self.online, profile=self.profile, running=self.running,
                                  records=records, shutdownAt=self.shutdown_at))

    def inspect(self):
        if self.worker and self.worker.is_alive():
            return self.snapshot()
        try:
            self.board = self.runtime.connect()
            status = self.runtime.request('GET', '/api/status')
            self.online = True
            self.profile = profile_for(status, self.runtime.request('GET', '/servo.html'))
            self.unloaded(status)
            if self.phase in ('idle', 'offline'):
                self.phase, self.message = 'ready', '已发现 UNO Q。保持只连接当前一只舵机。'
        except Offline as exc:
            self.online = False
            if self.phase not in ('shutdown',):
                self.phase, self.message = 'offline', str(exc)
        except SetupError as exc:
            self.phase, self.message = 'blocked', str(exc)
        return self.snapshot()

    @staticmethod
    def unloaded(status):
        if status.get('enabled') is not False or status.get('mode') not in ('shadow', 'off', 'servo_debug'):
            raise SetupError('板子未处于卸载状态。请先在运行端停止运动并卸载，再开始编号。')
        age = status.get('feedback_age_ms')
        if not isinstance(age, (int, float)) or age >= 500:
            raise SetupError('没有新鲜的 MCU 反馈，请检查扩展板与运行应用。')

    def heartbeat(self, force=False):
        if self.stop.is_set():
            raise Cancelled('已暂停。再次开始时会先读回设备状态。')
        if force or time.monotonic() - self.last_heartbeat > .3:
            status = self.runtime.request('GET', '/api/status')
            self.unloaded(status)
            self.runtime.request('POST', '/api/servo/enter', {})
            self.last_heartbeat = time.monotonic()
        if self.stop.is_set():
            raise Cancelled('已暂停。再次开始时会先读回设备状态。')

    def op(self, action, sid, **kwargs):
        self.heartbeat()
        reply = self.runtime.request('POST', '/api/servo', dict(action=action, target_id=sid, **kwargs))
        if reply.get('target_id') != sid or (action != 'ping' and reply.get('ok') is not True):
            raise SetupError('舵机回复未通过校验，请保持单只连接后重新检测。')
        return reply

    def configure_once(self):
        self.phase, self.progress = 'working', 0
        self.current = None
        self.online = False
        self.board = self.runtime.connect()
        if self.stop.is_set():
            raise Cancelled('已暂停。再次开始时会先读回设备状态。')
        status = self.runtime.request('GET', '/api/status')
        if self.stop.is_set():
            raise Cancelled('已暂停。再次开始时会先读回设备状态。')
        self.online = True
        self.profile = profile_for(status, self.runtime.request('GET', '/servo.html'))
        self.unloaded(status)
        self.heartbeat(force=True)
        deadline = time.monotonic() + 1.5
        while True:
            status = self.runtime.request('GET', '/api/status')
            self.unloaded(status)
            if status.get('mcu_servo_debug') is True:
                break
            if time.monotonic() >= deadline:
                raise SetupError('MCU 未确认舵机调试模式，请检查反馈后再试。')
            time.sleep(.05)
        found = []
        for sid in range(254):
            self.message = '扫描编号 %d / 253' % sid
            if self.op('ping', sid).get('ok') is True or self.op('ping', sid).get('ok') is True:
                found.append(sid)
                if len(found) > 1:
                    raise SetupError('检测到多个编号 %s。断开 USB 和电池后，只保留一只舵机。' % found)
        if not found:
            raise SetupError('未发现舵机。请检查供电和单只舵机的连接。')
        sid = found[0]
        records = self.store.servo_records(self.board)
        pending = next((r for r in records if r['state'] == 'pending'), None)
        record = next((r for r in records if r['id'] == sid), None)
        if pending:
            if sid not in (pending['sourceId'], pending['id']):
                raise SetupError('上一只的写入结果待复核。请先接回 ID%d 或 ID%d 的那只舵机。' % (pending['sourceId'], pending['id']))
            record = pending
        done = {r['id'] for r in records if r['state'] in ('verified', 'reported')}
        target = record['id'] if record else sid if sid in IDS else next((i for i in IDS if i not in done), None)
        if target is None:
            raise SetupError('十五个编号都已有记录，请接回对应舵机复核。')
        self.current = target
        readback = self.op('read', sid)
        fresh = record is None and sid not in IDS
        if record is None:
            record = dict(id=target, sourceId=sid, state='pending', mapVersion=MAP_VERSION,
                          midEvidence='not_started' if fresh else 'existing', labelled=None, installed=None)
        else:
            record = copy.deepcopy(record)
        record.update(state='pending', profile=self.profile, readback=readback, oldIdAbsent=False)
        self.store.save_servo_record(self.board, record)
        self.progress, self.message = 1, '读取完成，保持舵机卸载'
        if fresh:
            # Persist uncertainty before the command. A lost ACK must never cause a blind replay.
            record['midEvidence'] = 'unconfirmed'
            self.store.save_servo_record(self.board, record)
            self.op('reset_mid', sid)
            record['midEvidence'] = 'acknowledged'
            self.store.save_servo_record(self.board, record)
        self.progress, self.message = 2, '写入匹配运行端的 KP / KD'
        if fresh or any(readback.get(k) != self.profile[k] for k in ('kp', 'kd')):
            self.op('set_gains', sid, kp=self.profile['kp'], kd=self.profile['kd'])
        self.progress, self.message = 3, '设置目标编号'
        if sid != target:
            if self.op('ping', target).get('ok'):
                raise SetupError('目标编号已占用，请只保留当前舵机后重新检测。')
            self.op('set_id', sid, new_id=target)
        self.progress, self.message = 4, '读回参数，复核新旧编号'
        verified = self.op('read', target)
        old_absent = record['sourceId'] == target or not self.op('ping', record['sourceId']).get('ok')
        if not old_absent or any(verified.get(k) != self.profile[k] for k in ('kp', 'kd')):
            raise SetupError('参数或新旧编号读回不一致。这只仍待复核，再次开始时只修正不一致的项目。')
        record.update(state='verified', readback=verified, oldIdAbsent=old_absent,
                      verifiedAt=int(time.time() * 1000))
        self.store.save_servo_record(self.board, record)
        self.progress, self.phase, self.message = 5, 'success', 'ID%d 的编号与参数已读回验证。请给实物贴上编号。' % target
        return record

    def start(self):
        # Reuse the store's existing short critical section for simultaneous HTTP starts.
        with self.store.lock:
            if not self.worker or not self.worker.is_alive():
                self.stop.clear()
                self.running = True
                self.worker = threading.Thread(target=self._run, daemon=True, name='duck-servo-setup')
                self.worker.start()
        return self.snapshot()

    def _run(self):
        disconnected = False
        try:
            while not self.stop.is_set():
                if self.shutdown_at and time.time() * 1000 < self.shutdown_at + 15_000:
                    self.stop.wait(1)
                    continue
                if self.phase == 'success' and not disconnected:
                    try:
                        self.runtime.request('GET', '/api/status')
                    except Offline:
                        self.online, disconnected = False, True
                    self.stop.wait(1)
                    continue
                try:
                    self.configure_once()
                    disconnected = False
                    records = self.store.servo_records(self.board)
                    if set(IDS).issubset(r['id'] for r in records if r['state'] == 'verified'):
                        break
                except Offline as exc:
                    self.online, self.phase, self.message = False, 'offline', str(exc)
                    self.stop.wait(2)
                except SetupError as exc:
                    self.phase, self.message = 'blocked', str(exc)
                    break
        finally:
            self.running = False
            if self.stop.is_set():
                self.phase = 'paused'
            try:
                if self.online:
                    self.runtime.request('POST', '/api/servo/exit', {})
            except SetupError:
                pass

    def pause(self):
        self.stop.set()
        if self.worker:
            self.worker.join(timeout=10)
        if not self.worker or not self.worker.is_alive():
            self.phase = 'paused'
        return self.snapshot()

    def halt(self):
        if self.phase != 'success':
            raise SetupError('请等本只配置结束后再请求停机。')
        # The worker is only polling in success, never issuing servo writes here.
        self.runtime.halt()
        self.shutdown_at = int(time.time() * 1000)
        self.online, self.phase = False, 'shutdown'
        self.message = '停机命令已发送。等待至少 15 秒并确认停止，再断开 USB 和电池后换接舵机。'
        return self.snapshot()

    def close(self):
        self.pause()
        self.runtime.close()
