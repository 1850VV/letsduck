import zipfile,json,xml.etree.ElementTree as ET
from pathlib import Path

def effective(z):
 tree=ET.fromstring(z.read('Metadata/model_settings.config'));out={}
 for obj in tree.findall('object'):
  parent={x.get('key'):x.get('value') for x in obj.findall('metadata')}.get('extruder')
  for part in obj.findall('part'):out[part.get('uuid')]={x.get('key'):x.get('value') for x in part.findall('metadata')}.get('extruder',parent)
 return out,len(tree.findall('plate')),len(tree.findall('object'))
results=[]
for kind,source in [('baseline','outputs/XGO_Duck_Blue_White_Black_materials.3mf'),('eight','work/materials-v2/eight-materials.3mf'),('sixteen','work/materials-v2/sixteen-structural-fixture.3mf')]:
 a=zipfile.ZipFile(source);b=zipfile.ZipFile('work/materials-v2/bambu-check/'+kind+'-roundtrip.3mf')
 ac=json.loads(a.read('Metadata/project_settings.config'));bc=json.loads(b.read('Metadata/project_settings.config'))
 before,_,_=effective(a);after,plates,objects=effective(b)
 assert before==after
 assert all(value==bc[key] for key,value in ac.items())
 results.append(dict(name=kind,sourceConfigurationFields=len(ac),allSourceConfigurationValuesUnchanged=True,bambuAddedKeys=sorted(set(bc)-set(ac)),effectivePartAssignmentsEqual=True,parts=len(after),plates=plates,objects=objects,slots=len(bc['filament_colour']),nativeExitCode=0))
Path('work/materials-v2/native-validation.json').write_text(json.dumps(results,indent=2));print(json.dumps(results,indent=2))
