from pathlib import Path
from zipfile import ZipFile
import xml.etree.ElementTree as ET
import json, re, hashlib, shutil, collections, copy
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'outputs' / 'XGO_Duck_DeepSeek'
OUT.mkdir(parents=True, exist_ok=True)
SRC = Path('<temporary-path>)
Z = ZipFile(SRC)
C = '{http://schemas.microsoft.com/3dmanufacturing/core/2015/02}'
P = '{http://schemas.microsoft.com/3dmanufacturing/production/2015/06}'
main = ET.fromstring(Z.read('3D/3dmodel.model'))
settings = ET.fromstring(Z.read('Metadata/model_settings.config'))
project = json.loads(Z.read('Metadata/project_settings.config'))
new_colors = ['#FFFFFF', '#000000', '#0056B8', '#000000']
color_names = ['白色', '黑色', '钴蓝', '黑色']
materials = ['PLA Basic', 'PLA Basic', 'PLA Basic', 'TPU 90A']
res = {o.get('id'): o for o in main.find(C+'resources').findall(C+'object')}
build = {o.get('objectid'): o for o in main.find(C+'build')}
objs = {o.get('id'): o for o in settings.findall('object')}
def md(e): return {x.get('key'): x.get('value') for x in e.findall('metadata') if x.get('key')}
def transform(v, s):
    a = np.array(list(map(float, s.split()))).reshape(4, 3)
    return v @ a[:3] + a[3]
def font(n): return ImageFont.truetype('/Library/Fonts/Arial Unicode.ttf', n)
mesh_cache = {}
def mesh(path, oid):
    key = (path, oid)
    if key not in mesh_cache:
        r = ET.fromstring(Z.read(path))
        m = next(x for x in r.find(C+'resources').findall(C+'object') if x.get('id') == oid).find(C+'mesh')
        v = np.array([[float(x.get(k)) for k in ('x','y','z')] for x in m.find(C+'vertices')])
        f = np.array([[int(x.get(k)) for k in ('v1','v2','v3')] for x in m.find(C+'triangles')], dtype=np.int32)
        mesh_cache[key] = (v, f)
    return mesh_cache[key]

plates=[]; parts=[]; geo={}
for plate in settings.findall('plate'):
    info=md(plate); num=int(info['plater_id'])
    ids=[md(x)['object_id'] for x in plate.findall('model_instance')]
    plate_info={'plate':num,'original_name':info.get('plater_name',''),'object_ids':ids,'parts':[],'metadata':info}
    for oid in ids:
        obj=objs[oid]; obj_md=md(obj)
        components=res[oid].find(C+'components').findall(C+'component')
        objparts=obj.findall('part'); assert len(components)==len(objparts)
        for ix,(comp,part) in enumerate(zip(components,objparts)):
            pm=md(part); pid=part.get('id')
            assert pid==comp.get('objectid')
            slot=int(pm.get('extruder',obj_md.get('extruder','1')))
            path=comp.get(P+'path').lstrip('/')
            v,f=mesh(path,pid)
            vp=transform(v,comp.get('transform','1 0 0 0 1 0 0 0 1 0 0 0'))
            vp=transform(vp,build[oid].get('transform','1 0 0 0 1 0 0 0 1 0 0 0'))
            key=f'P{num}-{len(plate_info["parts"])+1:02d}'
            bbox=np.array([vp.min(0),vp.max(0)])
            record={'code':key,'plate':num,'object_id':int(oid),'object_name':obj_md['name'],
                    'part_index':ix,'part_id':int(pid),'part_uuid':part.get('uuid'),'part_name':pm['name'],
                    'quantity':1,'slot':slot,'original_color':project['filament_colour'][slot-1],
                    'new_color':new_colors[slot-1],'new_color_name':color_names[slot-1],
                    'material':materials[slot-1],'original_preset':project['filament_settings_id'][slot-1],
                    'mesh_file':path,'vertices':len(v),'triangles':len(f),
                    'print_bbox_mm':bbox.tolist(),'print_size_mm':(bbox[1]-bbox[0]).round(6).tolist(),
                    'component_transform':comp.get('transform'),'build_transform':build[oid].get('transform'),
                    'object_metadata':obj_md,'part_metadata':pm}
            assert int(part.find('mesh_stat').get('face_count'))==len(f)
            parts.append(record);plate_info['parts'].append(record);geo[key]=(vp,f)
    plates.append(plate_info)
assert len(plates)==6 and len(objs)==25 and len(parts)==35
assert {str(p['object_id']) for p in parts}==set(objs)==set(build)

# A deliberately minimal edit: two color fields, one ZIP member. No mesh or settings rewrite.
raw=Z.read('Metadata/project_settings.config').decode()
changed=raw
for field in ['filament_colour','filament_multi_colour']:
    pattern=r'("'+field+r'"\s*:\s*)\[[^\]]*\]'
    changed,n=re.subn(pattern,lambda m:m.group(1)+json.dumps(new_colors),changed)
    assert n==1
new_project=json.loads(changed)
assert {k for k in project if project[k]!=new_project[k]}=={'filament_colour','filament_multi_colour'}
dest=OUT/'XGO_Duck_DeepSeek_preserve_TPU90A.3mf'
with ZipFile(dest,'w') as z:
    for entry in Z.infolist():
        z.writestr(copy.copy(entry),changed.encode() if entry.filename=='Metadata/project_settings.config' else Z.read(entry.filename))
shutil.copy2(SRC,OUT/'XGO_Duck_V2_original.3mf')

# Full source settings, object overrides, hierarchy, placement and material evidence.
data={'source_file':SRC.name,'source_sha256':hashlib.sha256(SRC.read_bytes()).hexdigest(),
      'unit':main.get('unit'),'design':'DeepSeek blue-white-black; user brand reference #4D6BFE; printable blue #0056B8',
      'plate_count':len(plates),'object_count':len(objs),'part_instance_count':len(parts),
      'unique_mesh_resource_count':len(mesh_cache),'slots':[{'slot':i+1,'material':materials[i],
      'new_color':new_colors[i],'new_color_name':color_names[i],'original_preset':project['filament_settings_id'][i]} for i in range(4)],
      'plates':plates,'full_original_project_settings':project,
      'unverified':['Bambu Studio project open / slicing','Physical fit and motion','Filament batch color match','TPU 95A substitution','Hardware BOM assembly version'],
      'warnings':['Original embedded thumbnails retain original orange/white colors. Use newly rendered annotated maps for new colors.',
      'Embedded description says 4 walls / 13% infill, but actual project says 3 walls / 10% gyroid.',
      '2x part names describe intended total; 35 component instances already include duplicates. Do not multiply again.']}
(OUT/'BOM_and_all_source_parameters.json').write_text(json.dumps(data,ensure_ascii=False,indent=2))

# Per-instance mesh renders, with the actual 3MF component and build transforms.
def render(plate, size=1600, iso=False, labels=True):
    im=Image.new('RGB',(size,size),'#CEDAEA');draw=ImageDraw.Draw(im)
    n=plate['plate']; origin=np.array([((n-1)%3)*307.2, -((n-1)//3)*307.2, 0.])
    xyz=np.concatenate([geo[r['code']][0]-origin for r in plate['parts']])
    # Isometric view is illustrative; the top view is the placement reference.
    if iso:
        proj=np.array([[.7071,-.40825,.57735],[-.7071,-.40825,.57735],[0,.8165,.57735]])
        projected=xyz@proj; low=projected[:,:2].min(0);high=projected[:,:2].max(0)
        margin=size*.11;scale=(size-2*margin)/max(high-low)
        center=(high+low)/2
        def xy(v):
            a=v@proj
            return np.column_stack((size/2+(a[:,0]-center[0])*scale,size/2-(a[:,1]-center[1])*scale)),a[:,2]
    else:
        margin=size*.06;scale=(size-2*margin)/256
        def xy(v): return np.column_stack((margin+v[:,0]*scale,size-margin-v[:,1]*scale)),v[:,2]
        # Exact source plate grid, millimetres; all models must lie on these plates.
        for x in range(0,257,32):
            t=margin+x*scale
            draw.line((t,margin,t,size-margin),fill='#B8C9DF',width=1)
            draw.line((margin,t,size-margin,t),fill='#B8C9DF',width=1)
        draw.rectangle((margin,margin,size-margin,size-margin),outline='#AAB9CD',width=3)
    triangles=[]; centers=[]
    for r in plate['parts']:
        v,f=geo[r['code']];v=v-origin
        pix,depth=xy(v); tri=v[f]
        normals=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]);length=np.linalg.norm(normals,axis=1)
        normals=normals/np.maximum(length[:,None],1e-20)
        light=np.array([-.28,-.38,.88]);light/=np.linalg.norm(light)
        brightness=.66+.34*np.abs(normals@light)
        base=np.array(tuple(bytes.fromhex(r['new_color'][1:])),dtype=float)
        if r['new_color']=='#000000':base=np.array([38.,42.,49.])
        colors=np.clip(base[None,:]*brightness[:,None],0,255).astype(np.uint8)
        pp=pix[f]; zz=depth[f].mean(1)
        area=np.abs((pp[:,1,0]-pp[:,0,0])*(pp[:,2,1]-pp[:,0,1])-(pp[:,1,1]-pp[:,0,1])*(pp[:,2,0]-pp[:,0,0]))
        for k in np.flatnonzero(area>.025): triangles.append((float(zz[k]),pp[k],tuple(colors[k])))
        mid=(v.min(0)+v.max(0))/2
        centers.append((r['code'],xy(mid[None,:])[0][0],max(v[:,:2].max(0)-v[:,:2].min(0))<22))
        if not iso: assert v[:,:2].min()>-.2 and v[:,:2].max()<256.2,(r['code'],v.min(0),v.max(0))
    for _,p,c in sorted(triangles,key=lambda x:x[0]):draw.polygon([tuple(x) for x in p],fill=c)
    if labels:
        ft=font(round(size*.023));radius=round(size*.026)
        for code,(x0,y),small in centers:
            x=x0+size*.064 if small else x0
            if small: draw.line((x0,y,x-radius,y),fill='#344D71',width=max(2,round(size*.002)))
            # Exact part code rather than guesses about left/right position.
            text=code.split('-')[1]
            draw.ellipse((x-radius,y-radius,x+radius,y+radius),fill='#10274C',outline='white',width=round(size*.002))
            box=draw.textbbox((0,0),text,font=ft)
            draw.text((x-(box[2]-box[0])/2,y-(box[3]-box[1])/2-box[1]),text,font=ft,fill='white')
    return im

for p in plates:
    render(p).save(OUT/f'Plate_{p["plate"]}_map.png')
    render(p,1200,iso=True,labels=False).save(ROOT/'work'/f'iso_{p["plate"]}.png')

checks={'source_sha256':data['source_sha256'],'modified_sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),
        'zip_crc_test':None,'zip_member_count':len(Z.namelist()),'plate_count':6,'object_count':25,'part_instances':35,
        'unique_mesh_resources':len(mesh_cache),'changed_members':[],'changed_project_keys':[],
        'all_mesh_bytes_identical':True,'all_other_members_identical':True,'all_models_inside_original_256mm_plates':True,
        'slicer_open_and_slice':'NOT_EXECUTED - Bambu Studio is not installed',
        'physical_print_and_assembly':'NOT_EXECUTED'}
with ZipFile(dest) as q:
    checks['zip_crc_test']=q.testzip() or 'PASS'
    assert q.namelist()==Z.namelist()
    checks['changed_members']=[n for n in Z.namelist() if Z.read(n)!=q.read(n)]
    checks['changed_project_keys']=[k for k in project if project[k]!=json.loads(q.read('Metadata/project_settings.config'))[k]]
    assert checks['changed_members']==['Metadata/project_settings.config']
    for name in q.namelist():
        if name.endswith(('.xml','.model','.rels','.config')) and name!='Metadata/project_settings.config':
            ET.fromstring(q.read(name))
    assert all(Z.read(n)==q.read(n) for n in Z.namelist() if n.endswith('.model'))
checks['original_part_and_object_assignments_unchanged']=True
checks['all_non_color_project_settings_identical']=True
(OUT/'verification.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2))
print(json.dumps({'plates':[{k:p[k] for k in ['plate','original_name','object_ids']}|{'parts':len(p['parts'])} for p in plates],
                  'unique_meshes':len(mesh_cache),'total_triangles_instanced':sum(p['triangles'] for p in parts),'checks':checks},ensure_ascii=False,indent=2))
