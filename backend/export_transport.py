"""Bounded multipart decoding shared by both editions (standard library only)."""
import json
from email.parser import BytesParser
from email.policy import default

MAX_BODY = 8_000_000
NAMES = {'cover', *(f'{kind}{i}' for kind in ('plate', 'top') for i in range(1, 7))}


class ExportBodyError(ValueError):
    def __init__(self, status=400, code='request.format'):
        self.status = status
        self.body = {'error': '请求太大' if status == 413 else '请求格式不对', 'code': code, 'params': {}}
        super().__init__(code)


def parse_multipart(data, content_type):
    if len(data) > MAX_BODY: raise ExportBodyError(413, 'request.too_large')
    if len(content_type) > 256 or '\r' in content_type or '\n' in content_type: raise ExportBodyError()
    try:
        message = BytesParser(policy=default).parsebytes(('Content-Type: '+content_type+'\r\nMIME-Version: 1.0\r\n\r\n').encode('ascii')+data)
        boundary = message.get_boundary()
        if message.get_content_type() != 'multipart/form-data' or not boundary or len(boundary) > 70 or not message.is_multipart() or message.defects: raise ValueError()
        fields = {}
        for part in message.iter_parts():
            name = part.get_param('name', header='content-disposition')
            if part.is_multipart() or part.defects or part.get_content_disposition() != 'form-data' or name not in NAMES | {'plan'} or name in fields: raise ValueError()
            if len(part.get_all('content-disposition', [])) != 1 or part.get('content-transfer-encoding'): raise ValueError()
            value = part.get_payload(decode=True)
            if not isinstance(value, bytes) or len(value) > (200_000 if name == 'plan' else 600_000): raise ValueError()
            if name != 'plan' and part.get_content_type() != 'image/png': raise ValueError()
            fields[name] = value
        if set(fields) != NAMES | {'plan'}: raise ValueError()
        plan = json.loads(fields.pop('plan'))
        if not isinstance(plan, dict) or 'thumbnails' in plan: raise ValueError()
        return {**plan, 'thumbnails': fields}
    except (ValueError, TypeError, UnicodeError, KeyError):
        raise ExportBodyError() from None
