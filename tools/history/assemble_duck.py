from prepare_geometry import *
import itertools,hashlib
from scipy.spatial.transform import Rotation
# Fit the actual 3MF meshes to the official articulated assembly. Transforms only.
rots=[]
for p in itertools.permutations(range(3)):
 for signs in itertools.product([-1,1],repeat=3):
  q=np.eye(3)[list(p)]*np.array(signs)[:,None]
  if np.linalg.det(q)>.99:rots.append(q)

def fit(s,t):
 rng=np.random.default_rng(41)
 sv,_=trimesh.sample.sample_surface(s,1800,seed=41)
 tv,_=trimesh.sample.sample_surface(t,24000,seed=41)
 tv=np.vstack([tv,t.vertices]);tree=cKDTree(tv)
 sc=(s.bounds[0]+s.bounds[1])/2;tc=(t.bounds[0]+t.bounds[1])/2
 options=[]
 for r in rots:
  rr=r.copy();tr=tc-rr@sc
  for _ in range(25):
   a=sv@rr.T+tr;d,i=tree.query(a);b=tv[i];mask=d<np.quantile(d,.94)
   aa=a[mask];bb=b[mask];ac=aa.mean(0);bc=bb.mean(0)
   u,_,vt=np.linalg.svd((aa-ac).T@(bb-bc));dr=vt.T@u.T
   if np.linalg.det(dr)<0:vt[-1]*=-1;dr=vt.T@u.T
   dt=bc-dr@ac;rr=dr@rr;tr=dr@tr+dt
  d,_=tree.query(sv@rr.T+tr);score=np.mean(np.minimum(d,8)**2)
  options.append((score,rr,tr,np.quantile(d,[.5,.95]).tolist()))
 score,r,tr,err=min(options,key=lambda x:x[0]);T=np.eye(4);T[:3,:3]=r;T[:3,3]=tr
 return T,err
Tmap={};evidence={};used=set()
def register(code,link,ix):
 target=components[link][ix];local,err=fit(source[code],target);T=pose(link)@local;Tmap[code]=T;used.add((link,ix));evidence[code]={'method':'surface registration to official assembly','link':link,'component':ix,'fit_distance_mm_median_p95':err}
 print('FIT',code,link,ix,np.round(err,2).tolist(),flush=True)
# Shared original CAD coordinates establish all head positions from the registered shell.
register('P4-01','head_roll',3)
head_map={'P4-01':'head_shell.stl','P4-02':'head_servo_support.stl','P2-01':'jaw.stl','P2-02':'head.stl','P2-06':'eye_shell.stl','P3-01':'eye.stl','P1-01':'mouth_buttom_tpu.stl','P1-02':'mouth_up_tpu.stl'}
head_center=trimesh.load(OFF/'xgoduck_hardware/head_shell.stl',force='mesh').bounds.mean(0)
for code,fn in head_map.items():
 if code=='P4-01':continue
 m=trimesh.load(OFF/'xgoduck_hardware'/fn,force='mesh');T=Tmap['P4-01'].copy();T[:3,3]+=T[:3,:3]@(m.bounds.mean(0)-head_center);Tmap[code]=T;evidence[code]={'method':'original CAD relative head coordinates; registered via head shell','reference':fn}
for ix in [1,3,4,5,8]:used.add(('head_roll',ix))
# The URDF splits several visual links into distinct printable and purchased components.
for code,link,ix in [
 ('P3-02','neck_pitch',0),('P3-03','neck_pitch',2),
 ('P3-04','right_hip_roll',1),('P3-05','left_hip_roll',0),
 ('P4-03','trunk_base',5),('P5-01','right_hip_pitch',4),('P5-02','left_hip_pitch',1),
 ('P5-03','trunk_base',9),('P5-04','right_hip_pitch',1),('P5-05','left_hip_pitch',2),
 ('P6-01','head_pitch',0),('P6-02','right_hip_yaw',1),('P6-03','left_hip_yaw',3),
 ('P6-04','right_knee',2),('P6-05','left_knee',1),('P6-06','right_hip_yaw',2),('P6-07','left_hip_yaw',0),
 ('P6-08','head_yaw',0),('P6-09','trunk_base',7)]:register(code,link,ix)
# Body shells: determine side from official assembled coordinates, not file order.
for ix in [1,2]:
 m=components['trunk_base'][ix];code='P5-07' if m.centroid[1]>0 else 'P5-06';register(code,'trunk_base',ix)
# Foot soles share the rigid foot's original CAD frame.
for foot,sole,axle,link,fn in [('P2-03','P1-03','P2-05','right_ankle','right_foot.stl'),('P2-04','P1-04','P2-07','left_ankle','left_foot.stl')]:
 fm=trimesh.load(OFF/'xgoduck_hardware'/fn,force='mesh');sm=trimesh.load(OFF/'xgoduck_hardware/2x_foot_bottom_tpu.stl',force='mesh');combined=trimesh.util.concatenate([fm,sm]);T,err=fit(combined,urdf[link]);T=pose(link)@T
 for code,m in [(foot,fm),(sole,sm)]:
  out=T.copy();out[:3,3]+=out[:3,:3]@m.bounds.mean(0);Tmap[code]=out;evidence[code]={'method':'shared original foot CAD frame registered to official ankle','fit_distance_mm_median_p95':err,'link':link}
 # Small axle disc: indicative placement, not a validated manufacturing assembly.
 out=T.copy();out[:3,3]+=out[:3,:3]@np.array([0,29,0]);Tmap[axle]=out;evidence[axle]={'method':'approximate axle placement for preview','verified':False}
 used.add((link,0));print('FOOT',link,np.round(err,2),flush=True)
assert set(Tmap)==set(source)
# Rotate global URDF frame (x forward, z up) into browser y-up coordinates.
U=np.array([[0,1,0,0],[0,0,1,128.5],[1,0,0,0],[0,0,0,1.]])
blocks=[];byteoffset=0
manifest={'source_sha256':bom['source_sha256'],'parts':[],'hardware':[],'source_file':'XGO_duckV2.3mf','assembly_note':'原始打印零件网格共 35 个。装配位置参考官方 XGO Duck V2 模型进行配准；脚部、部分外壳有版本差异，两个踝轴为示意定位。仅用于配色预览，未验证实物装配公差。'}
def put(m):
 global byteoffset
 v=np.asarray(m.vertices,dtype='<f4');f=np.asarray(m.faces,dtype='<u4');item={'positionOffset':byteoffset,'vertexCount':len(v),'indexOffset':byteoffset+v.nbytes,'indexCount':f.size};blocks.extend([v.tobytes(),f.tobytes()]);byteoffset+=v.nbytes+f.nbytes;return item
pairs=[['P1-03','P1-04'],['P2-03','P2-04'],['P2-05','P2-07'],['P3-02','P3-03'],['P3-04','P3-05'],['P5-01','P5-02'],['P5-04','P5-05'],['P5-06','P5-07'],['P6-02','P6-03'],['P6-04','P6-05'],['P6-06','P6-07']]
partnames={'P1-01':'下嘴软垫','P1-02':'上嘴软垫','P1-03':'右脚底软垫','P1-04':'左脚底软垫','P2-01':'下巴','P2-02':'头部平台','P2-03':'右脚','P2-04':'左脚','P2-05':'右踝轴','P2-06':'眼睛外壳','P2-07':'左踝轴','P3-01':'眼睛','P3-02':'颈部连接板 A','P3-03':'颈部连接板 B','P3-04':'右 Roll 舵机输出','P3-05':'左 Roll 舵机输出','P4-01':'头盖','P4-02':'头部舵机固定件','P4-03':'身体背板','P5-01':'大腿右外壳','P5-02':'大腿左外壳','P5-03':'电池仓','P5-04':'右大腿支撑','P5-05':'左大腿支撑','P5-06':'身体右外壳','P5-07':'身体左外壳','P6-01':'头部俯仰支架','P6-02':'右 Roll 舵机盖板','P6-03':'左 Roll 舵机盖板','P6-04':'右小腿','P6-05':'左小腿','P6-06':'右 Yaw 连接件','P6-07':'左 Yaw 连接件','P6-08':'头部 Yaw 支架','P6-09':'髋部 Yaw 支撑'}
headcodes=set(head_map)|{'P3-02','P3-03','P6-01','P6-08'};bodycodes={'P4-03','P5-03','P5-06','P5-07','P6-09'}
for r in parts:
 c=r['code'];m=source[c];display=m.copy();display.apply_transform(U@Tmap[c]);g=put(display)
 pv=affine(affine(m.vertices,r['component_transform']),r['build_transform']);n=r['plate'];origin=np.array([((n-1)%3)*307.2,-((n-1)//3)*307.2,0.]);pv=pv-origin
 # Use the full original local print placement, then arrange six plates into a compact gallery.
 pv=np.column_stack([pv[:,0]-128+((n-1)%3-1)*290,pv[:,2],128-pv[:,1]+((n-1)//3-.5)*290])
 po=byteoffset;blocks.append(np.asarray(pv,dtype='<f4').tobytes());byteoffset+=pv.size*4
 pair=next((p[1] if p[0]==c else p[0] for p in pairs if c in p),None)
 manifest['parts'].append({'id':c,'uuid':r['part_uuid'],'name':partnames[c],'originalName':r['part_name'],'group':'head' if c in headcodes else 'body' if c in bodycodes else 'legs','plate':r['plate'],'material':r['material'],'color':r['new_color'],'pair':pair,'sourceObject':r['object_id'],'sourcePart':r['part_id'],'triangles':len(m.faces),'geometry':g,'printPositionOffset':po,'center':display.bounds.mean(0).tolist(),'assemblyEvidence':evidence[c]})
for link,cs in components.items():
 for ix,m in enumerate(cs):
  if (link,ix) in used:continue
  m=m.copy();m.apply_transform(U@pose(link));manifest['hardware'].append({'name':link+'_'+str(ix),'geometry':put(m),'color':'#242832' if len(m.faces) in [980,1524] else '#535965'})
(OUT/'geometry.bin').write_bytes(b''.join(blocks));(OUT/'model.json').write_text(json.dumps(manifest,ensure_ascii=False,separators=(',',':')))
Path('work/assembly_transforms.json').write_text(json.dumps({c:T.tolist() for c,T in Tmap.items()}))
Path('work/assembly_evidence.json').write_text(json.dumps(evidence,indent=2))
print('EXPORT',byteoffset,len(manifest['parts']),len(manifest['hardware']),flush=True)
