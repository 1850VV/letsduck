"""Local workspace server. Python standard library only; no cloud writes."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from functools import partial
import json, urllib.request, webbrowser, argparse
from exporter import ROOT, MODEL, CATALOG, InvalidDesign, plan, export_3mf
VERSION='2.0.0'
class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control','no-store')
        self.send_header('X-Content-Type-Options','nosniff')
        super().end_headers()
    def reply(self,status,data,content_type='application/json; charset=utf-8',filename=None):
        if not isinstance(data,bytes):data=json.dumps(data,ensure_ascii=False).encode()
        self.send_response(status);self.send_header('Content-Type',content_type);self.send_header('Content-Length',str(len(data)))
        if filename:self.send_header('Content-Disposition',f'attachment; filename="{filename}"')
        self.end_headers();self.wfile.write(data)
    def do_GET(self):
        if self.path=='/api/health':
            return self.reply(200,dict(version=VERSION,source_sha256=MODEL['source_sha256'],productCount=len(CATALOG['products'])))
        if self.path=='/api/catalog':return self.reply(200,CATALOG)
        if self.path.startswith('/api/'):return self.reply(404,{'error':'未知接口'})
        if self.path.split('?',1)[0].endswith(('.py','.command')):
            return self.reply(404,{'error':'此文件不通过网页提供'})
        super().do_GET()
    def do_POST(self):
        origin=self.headers.get('Origin')
        expected=f'http://127.0.0.1:{self.server.server_port}'
        if origin and origin!=expected:return self.reply(403,{'error':'请从本机工作台导出'})
        if self.headers.get('Content-Type','').split(';')[0]!='application/json':return self.reply(415,{'error':'需要 JSON 请求'})
        try:
            length=int(self.headers.get('Content-Length','0'))
            if not 0<length<=8000000:return self.reply(413,{'error':'请求大小无效'})
            data=json.loads(self.rfile.read(length))
            if self.path=='/api/plan':return self.reply(200,plan(data))
            if self.path=='/api/export':
                content,report=export_3mf(data)
                return self.reply(200,content,'model/3mf','XGO-Duck-materials.3mf')
            return self.reply(404,{'error':'未知接口'})
        except (ValueError,InvalidDesign) as exc:return self.reply(422,{'error':str(exc)})
        except Exception:
            import traceback;traceback.print_exc()
            return self.reply(500,{'error':'导出校验未通过，未生成文件。请查看本地服务日志。'})

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--no-open',action='store_true');parser.add_argument('--port',type=int,default=8876);args=parser.parse_args()
    for port in range(args.port,args.port+21):
        url=f'http://127.0.0.1:{port}/'
        try:
            with urllib.request.urlopen(url+'api/health',timeout=.4) as response:
                health=json.load(response)
                if health.get('version')==VERSION and health.get('source_sha256')==MODEL['source_sha256']:
                    print('机器鸭工作台已在运行：'+url)
                    if not args.no_open:webbrowser.open(url)
                    return
        except (OSError,ValueError):pass
        try:
            server=ThreadingHTTPServer(('127.0.0.1',port),partial(Handler,directory=str(ROOT)));break
        except OSError:continue
    else:raise SystemExit('没有可用预览端口。')
    print('机器鸭配色工作台：'+url,flush=True)
    print('保持此窗口打开；按 Control+C 停止。',flush=True)
    if not args.no_open:webbrowser.open(url)
    try:server.serve_forever()
    except KeyboardInterrupt:pass
    finally:server.server_close()
if __name__=='__main__':main()
