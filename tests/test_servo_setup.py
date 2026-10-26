"""Hardware boundary double; the real coordinator and SQLite run unchanged."""
import copy
import sys
import tempfile
import unittest
import threading
import json
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'personal'))
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'backend'))
from schemes import PersonalStore
from servo_setup import ServoSetup, AdbRuntime, Offline, SetupError


class Runtime:
    serial = 'uno-q-test'

    def __init__(self, ids=(1,)):
        self.servos = {sid: dict(raw_pos=457, center_pos=2047, kp=5, kd=10) for sid in ids}
        self.actions = []
        self.online = True
        self.lose_after = None
        self.reject_gains = False
        self.status = dict(mode='shadow', enabled=False, feedback_age_ms=10,
                           mcu_servo_debug=False, servo_scan_version=2, imu_ok=True)
        self.html = '<input id="kp" value="5"><input id="kd" value="10">'

    def connect(self):
        if not self.online:
            raise Offline('设备已断开')
        return self.serial

    def request(self, method, path, body=None):
        self.connect()
        if path == '/servo.html':
            return self.html
        if path == '/api/status':
            return copy.deepcopy(self.status)
        if path == '/api/servo/enter':
            self.status.update(mode='servo_debug', mcu_servo_debug=True)
            return {'mode': 'servo_debug'}
        if path == '/api/servo/exit':
            self.status.update(mode='shadow', mcu_servo_debug=False)
            return {'mode': 'shadow'}
        assert method == 'POST' and path == '/api/servo', (method, path)
        action, sid = body['action'], body['target_id']
        self.actions.append((action, sid, copy.deepcopy(body)))
        reply = dict(op=7, target_id=sid, ok=sid in self.servos, raw_pos=0,
                     center_pos=2047, kp=0, kd=0)
        if action == 'ping':
            return reply
        if sid not in self.servos:
            raise SetupError('舵机未响应')
        if action == 'read':
            return dict(reply, op=6, **self.servos[sid])
        if action == 'set_gains' and not self.reject_gains:
            self.servos[sid].update(kp=body['kp'], kd=body['kd'])
        if action == 'set_id':
            assert body['new_id'] not in self.servos
            self.servos[body['new_id']] = self.servos.pop(sid)
        if action == self.lose_after:
            self.online = False
            self.lose_after = None
            raise Offline('写入后 USB 断开')
        return dict(reply, ok=True)

    def halt(self):
        self.online = False

    def close(self):
        pass


class SetupTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.store = PersonalStore(Path(self.tmp.name) / 'personal.db')
        self.runtime = Runtime()
        self.setup = ServoSetup(self.store, self.runtime)

    def tearDown(self):
        self.setup.close()
        self.store.close()
        self.tmp.cleanup()

    def writes(self):
        return [a for a, _, _ in self.runtime.actions if a not in ('ping', 'read')]

    def test_configures_new_servo_and_persists_only_readback_proof(self):
        self.setup.configure_once()
        self.assertEqual(set(self.runtime.servos), {10})
        self.assertEqual(self.runtime.servos[10]['kd'], 10)
        self.assertEqual(self.writes(), ['reset_mid', 'set_gains', 'set_id'])
        record = self.setup.snapshot()['records'][0]
        self.assertEqual((record['id'], record['state'], record['sourceId']), (10, 'verified', 1))
        self.assertEqual(record['readback']['kp'], 5)
        self.assertEqual(record['readback']['kd'], 10)
        self.assertTrue(record['oldIdAbsent'])
        self.assertEqual(record['midEvidence'], 'acknowledged')
        other = PersonalStore(self.store.path)
        try:
            self.assertEqual(other.servo_records(self.runtime.serial), [record])
        finally:
            other.close()

    def test_two_responding_ids_never_receive_configuration_writes(self):
        self.runtime.servos[10] = dict(self.runtime.servos[1])
        with self.assertRaisesRegex(SetupError, '多个'):
            self.setup.configure_once()
        self.assertEqual(self.writes(), [])
        self.assertEqual(self.setup.snapshot()['records'], [])

    def test_reconnected_id10_is_read_back_without_becoming_id11(self):
        self.runtime.servos[10] = self.runtime.servos.pop(1)
        self.setup.configure_once()
        self.setup.configure_once()
        self.assertEqual(set(self.runtime.servos), {10})
        self.assertEqual(self.writes(), [])
        self.assertEqual(self.setup.snapshot()['targetId'], 11)
        self.assertEqual(self.setup.snapshot()['records'][0]['midEvidence'], 'existing')

    def test_id_write_disconnect_is_pending_then_read_back_without_replaying(self):
        self.runtime.lose_after = 'set_id'
        with self.assertRaises(Offline):
            self.setup.configure_once()
        record = self.setup.snapshot()['records'][0]
        self.assertEqual(record['state'], 'pending')
        self.assertEqual(set(self.runtime.servos), {10})
        self.runtime.online = True
        self.setup.close()
        self.setup = ServoSetup(self.store, self.runtime)
        self.setup.configure_once()
        self.assertEqual(self.writes(), ['reset_mid', 'set_gains', 'set_id'])
        self.assertEqual(self.setup.snapshot()['records'][0]['state'], 'verified')

    def test_unknown_profile_is_read_only(self):
        self.runtime.html = '<input id="kp" value="7"><input id="kd" value="99">'
        with self.assertRaisesRegex(SetupError, '配置档'):
            self.setup.configure_once()
        self.assertEqual(self.writes(), [])

    def test_armed_runtime_cannot_be_repurposed_by_setup(self):
        self.runtime.status.update(mode='policy', enabled=True)
        with self.assertRaisesRegex(SetupError, '卸载'):
            self.setup.configure_once()
        self.assertEqual(self.runtime.status['mode'], 'policy')
        self.assertEqual(self.writes(), [])

    def test_failed_parameter_readback_stays_pending_and_repairs_only_parameters(self):
        self.runtime.servos[1]['kd'] = 20
        self.runtime.reject_gains = True
        with self.assertRaisesRegex(SetupError, '读回'):
            self.setup.configure_once()
        self.assertEqual(self.setup.snapshot()['records'][0]['state'], 'pending')
        self.runtime.reject_gains = False
        self.setup.configure_once()
        self.assertEqual(self.writes(), ['reset_mid', 'set_gains', 'set_id', 'set_gains'])
        self.assertEqual(self.setup.snapshot()['records'][0]['state'], 'verified')

    def test_interrupted_mid_is_never_blindly_replayed_or_claimed_verified(self):
        self.runtime.lose_after = 'reset_mid'
        with self.assertRaises(Offline):
            self.setup.configure_once()
        self.runtime.online = True
        self.setup.configure_once()
        self.assertEqual(self.writes().count('reset_mid'), 1)
        record = self.setup.snapshot()['records'][0]
        self.assertEqual(record['midEvidence'], 'unconfirmed')
        self.assertEqual(record['state'], 'verified')  # ID and gains; mechanical calibration is separate.

    def test_stale_mcu_feedback_prevents_writes(self):
        self.runtime.status['feedback_age_ms'] = 9999
        with self.assertRaisesRegex(SetupError, '反馈'):
            self.setup.configure_once()
        self.assertEqual(self.writes(), [])


class TransportTests(unittest.TestCase):
    def test_an_android_device_is_never_forwarded_or_halted(self):
        runtime = AdbRuntime()
        with patch.object(runtime, 'command', side_effect=['List of devices attached\nphone device', 'Google Pixel']) as command:
            with self.assertRaises(Offline):
                runtime.connect()
            self.assertEqual(command.call_count, 2)

    def test_forward_is_local_dynamic_and_only_owned_forward_is_removed(self):
        runtime = AdbRuntime()
        with patch.object(runtime, 'command', side_effect=['List of devices attached\nuno device', 'Arduino UNO Q\x00', '49152', '']) as command:
            self.assertEqual(runtime.connect(), 'uno')
            self.assertEqual(runtime.port, 49152)
            runtime.close()
            self.assertEqual(command.call_args_list[2].args, ('-s', 'uno', 'forward', 'tcp:0', 'tcp:9527'))
            self.assertEqual(command.call_args_list[3].args, ('-s', 'uno', 'forward', '--remove', 'tcp:49152'))

    def test_halt_rechecks_identity_before_running_only_on_the_board(self):
        runtime = AdbRuntime()
        runtime.serial, runtime.port = 'uno', 49152
        with patch.object(runtime, 'command', return_value='Other device') as command:
            with self.assertRaises(SetupError):
                runtime.halt()
            self.assertEqual(command.call_count, 1)


class ApiTests(unittest.TestCase):
    def test_setup_status_and_cross_origin_write_boundary(self):
        import app
        with tempfile.TemporaryDirectory() as tmp:
            runtime = Runtime()
            server = app.create_server('127.0.0.1', 0, db=Path(tmp) / 'personal.db', servo_runtime=runtime)
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            base = 'http://127.0.0.1:%d' % server.server_address[1]
            try:
                with urlopen(base + '/api/servo-setup') as response:
                    self.assertEqual(json.load(response)['phase'], 'ready')
                req = Request(base + '/api/servo-setup/start', b'{}', headers={
                    'Content-Type': 'application/json', 'Origin': 'http://another-page.example'})
                with self.assertRaises(HTTPError) as caught:
                    urlopen(req)
                self.assertEqual(caught.exception.code, 403)
                self.assertEqual(runtime.actions, [])
            finally:
                server.shutdown()
                server.server_close()
                server.store.close()
                thread.join()


if __name__ == '__main__':
    unittest.main()
