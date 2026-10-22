import sys
from pathlib import Path
sys.path.insert(0,str(Path('work/pylibs').resolve()))
import numpy as np, trimesh, json,xml.etree.ElementTree as E
from scipy.spatial import cKDTree
from scipy.spatial.transform import Rotation as R
from zipfile import ZipFile
OUT=Path('outputs/duck-color-studio/assets');OFF=Path('work/official');SRC=Path('outputs/XGO_Duck_DeepSeek')
ns={'m':'http://schemas.microsoft.com/3dmanufacturing/core/2015/02'}
bom=json.loads((SRC/'BOM_and_all_source_parameters.json').read_text());parts=[r for p in bom['plates'] for r in p['parts']];z=ZipFile(SRC/'XGO_Duck_V2_original.3mf')
def affine(vertices,s):
 a=np.array(list(map(float,s.split()))).reshape(4,3);return vertices@a[:3]+a[3]
def load3mf(r):
 root=E.fromstring(z.read(r['mesh_file']));o=next(o for o in root.findall('m:resources/m:object',ns) if int(o.get('id'))==r['part_id']);v=np.array([[float(n.get(k)) for k in ['x','y','z']] for n in o.findall('m:mesh/m:vertices/m:vertex',ns)]);f=np.array([[int(n.get(k)) for k in ['v1','v2','v3']] for n in o.findall('m:mesh/m:triangles/m:triangle',ns)]);return trimesh.Trimesh(v,f,process=False)
source={r['code']:load3mf(r) for r in parts}
robot=E.parse('work/XGODUCK_official.urdf').getroot();joints={j.find('child').get('link'):j for j in robot.findall('joint')}
def pose(name):
 if name not in joints:return np.eye(4)
 j=joints[name];o=j.find('origin');T=np.eye(4);T[:3,:3]=R.from_euler('xyz',list(map(float,o.get('rpy').split()))).as_matrix();T[:3,3]=np.array(list(map(float,o.get('xyz').split())))*1000
 return pose(j.find('parent').get('link'))@T
urdf={p.stem:trimesh.load(p,force='mesh') for p in (OFF/'xgoduck_rl').glob('*.stl')}
for m in urdf.values():m.vertices*=1000
components={}
for name,m in urdf.items():
 cs=[c for c in m.split(only_watertight=False,repair=False) if len(c.faces)>=30]
 components[name]=cs
 print(name,'pose',np.round(pose(name)[:3,3],1),'size',np.round(m.extents,1),'components',[(len(c.faces),np.round(c.extents,1).tolist()) for c in cs])
if __name__=='__main__':
 from PIL import Image,ImageDraw
 allparts=[]
 for name,m in urdf.items():
  m=m.copy();m.apply_transform(pose(name));allparts.append(m)
 whole=trimesh.util.concatenate(allparts)
 whole.export('work/official_assembly.stl')
 print('full bbox',whole.bounds)
