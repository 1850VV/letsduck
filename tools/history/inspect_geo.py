import numpy as np,json,xml.etree.ElementTree as E
from pathlib import Path
from zipfile import ZipFile
b=json.loads(Path('outputs/XGO_Duck_DeepSeek/BOM_and_all_source_parameters.json').read_text());z=ZipFile('outputs/XGO_Duck_DeepSeek/XGO_Duck_V2_original.3mf');ns={'m':'http://schemas.microsoft.com/3dmanufacturing/core/2015/02'}
for r in [r for p in b['plates'] for r in p['parts']]:
 root=E.fromstring(z.read(r['mesh_file']));o=next(o for o in root.findall('m:resources/m:object',ns) if int(o.get('id'))==r['part_id']);v=np.array([[float(n.get(k)) for k in ['x','y','z']] for n in o.findall('m:mesh/m:vertices/m:vertex',ns)])
 off=np.array([float(r['part_metadata'].get('source_offset_'+k,0)) for k in 'xyz']);print('3MF',r['code'],r['part_name'],'size',np.round(np.ptp(v,axis=0),1),'center',np.round((v.max(0)+v.min(0))/2,1),'off',np.round(off,1))
for d in ['xgoduck_hardware','xgoduck_rl']:
 for p in sorted(Path('work/official/'+d).glob('*')):
  raw=p.read_bytes();n=int.from_bytes(raw[80:84],'little');dt=np.dtype([('n','<f4',(3,)),('v','<f4',(3,3)),('a','<u2')]);v=np.frombuffer(raw[84:],dt)['v'].reshape(-1,3);print(d,p.stem,'size',np.round(np.ptp(v,axis=0),1),'center',np.round((v.max(0)+v.min(0))/2,1),'tri',n)
