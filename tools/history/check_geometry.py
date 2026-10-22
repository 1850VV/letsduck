from pathlib import Path
import json,sys,hashlib,contextlib,io
with contextlib.redirect_stdout(io.StringIO()):
 from prepare_geometry import *
model=json.loads((OUT/'model.json').read_text());binary=(OUT/'geometry.bin').read_bytes();ts=json.loads(Path('work/assembly_transforms.json').read_text());U=np.array([[0,1,0,0],[0,0,1,128.5],[1,0,0,0],[0,0,0,1.]])
assert abs(np.linalg.det(U[:3,:3])-1)<1e-12
checks={};checks['source_3mf_unchanged']=hashlib.sha256((SRC/'XGO_Duck_V2_original.3mf').read_bytes()).hexdigest()==bom['source_sha256']==model['source_sha256']
checks['part_ids_and_uuids_unique']=len({p['id'] for p in model['parts']})==len({p['uuid'] for p in model['parts']})==35
checks['all_6_plates']=sorted({p['plate'] for p in model['parts']})==[1,2,3,4,5,6]
checks['all_original_meshes_and_print_placements_preserved']=True
max_error=0
for p in model['parts']:
 c=p['id'];m=source[c];r=next(r for r in parts if r['code']==c);g=p['geometry'];v=np.frombuffer(binary,dtype='<f4',count=g['vertexCount']*3,offset=g['positionOffset']).reshape(-1,3);idx=np.frombuffer(binary,dtype='<u4',count=g['indexCount'],offset=g['indexOffset']).reshape(-1,3)
 assert np.array_equal(idx,m.faces)
 T=np.array(ts[c]);assert np.max(np.abs(T[:3,:3].T@T[:3,:3]-np.eye(3)))<1e-10;assert abs(np.linalg.det(T[:3,:3])-1)<1e-10
 expected=trimesh.transform_points(m.vertices,U@T);error=float(np.max(np.abs(expected-v)));max_error=max(max_error,error);assert error<.0001
 pv=affine(affine(m.vertices,r['component_transform']),r['build_transform']);n=r['plate'];pv-=np.array([((n-1)%3)*307.2,-((n-1)//3)*307.2,0]);expected=np.column_stack([pv[:,0]-128+((n-1)%3-1)*290,pv[:,2],128-pv[:,1]+((n-1)//3-.5)*290]);actual=np.frombuffer(binary,dtype='<f4',count=len(m.vertices)*3,offset=p['printPositionOffset']).reshape(-1,3);assert np.max(np.abs(expected-actual))<.0001
 assert p['color']==r['new_color'] and p['material']==r['material']
checks['only_rigid_transforms_in_assembly']=True
checks['baseline_colors_and_materials_match_BOM']=True
checks['original_triangle_count_213704']=sum(p['triangles'] for p in model['parts'])==213704
export=json.loads(Path('work/qa-export.json').read_text());checks['export_has_all_35_part_ids']=set(p['id'] for p in export['parts'])==set(p['id'] for p in model['parts']);checks['export_retains_original_materials']=all(p['material']==next(r['material'] for r in model['parts'] if r['id']==p['id']) for p in export['parts']);checks['export_marked_prototype_only']=export['prototype_only']
raw=Path('work/interaction_checks.txt').read_text();interactions=json.loads(raw.split('### Result\n',1)[1].split('\n### Ran',1)[0]);assert all(t['pass'] for t in interactions)
report={'checked_at':'2026-10-22','data_checks':checks,'max_float32_display_coordinate_error_mm':max_error,'interaction_checks':interactions,'not_verified':['physical assembly, fit or motion','real filament appearance / SKU / inventory','Bambu Studio export or slicing (not implemented in prototype)','MCP (not connected)','subjective user acceptance'],'assembly_limitations':model['assembly_note']}
Path('outputs/duck-color-studio/verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps({'checks':checks,'interaction_pass_count':len(interactions),'max_display_coordinate_error_mm':max_error},ensure_ascii=False))
