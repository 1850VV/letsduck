"""Standard-library multipart fixtures for both editions."""
import base64
import json

def multipart(body):
    plan={k:v for k,v in body.items() if k!='thumbnails'}
    parts=[b'--duck-test\r\nContent-Disposition: form-data; name="plan"\r\n\r\n'+json.dumps(plan).encode()]
    for name,image in body['thumbnails'].items():
        parts.append(b'--duck-test\r\nContent-Disposition: form-data; name="'+name.encode()+b'"; filename="preview.png"\r\nContent-Type: image/png\r\n\r\n'+base64.b64decode(image.split(',')[1]))
    return b'\r\n'.join(parts)+b'\r\n--duck-test--\r\n'
