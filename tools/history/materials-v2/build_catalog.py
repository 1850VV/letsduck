from pathlib import Path
import json,re,hashlib,shutil,zipfile
root=Path('outputs/duck-color-studio'); assets=root/'assets'; source=Path('outputs/XGO_Duck_DeepSeek/XGO_Duck_V2_original.3mf')
shutil.copy2(source,assets/'source.3mf')
records=json.loads(Path('work/materials-v2/color_codes.json').read_text())['data']
commit='79df7ae309be398ed30c9f397c13c9911c2edc57'
products=[]
for row in records:
 if row['fila_id'] not in ['GFA00','GFU03'] or row['fila_color_type']!='单色':continue
 rgba=row['fila_color'][0].upper();material='PLA Basic' if row['fila_id']=='GFA00' else 'TPU 90A'
 products.append(dict(id='bambu-'+row['fila_id']+'-'+row['fila_color_code'],brand='Bambu Lab',series=material,material='PLA' if row['fila_id']=='GFA00' else 'TPU',hardness=None if row['fila_id']=='GFA00' else '90A',colorCode=row['fila_color_code'],familyId=row['fila_id'],name=row['fila_color_name']['zh'],nameEn=row['fila_color_name']['en'],hex=rgba[:7],alpha=int(rgba[7:9],16)/255,diameter=1.75,productUrl='https://us.store.bambulab.com/products/'+('pla-basic-filament' if row['fila_id']=='GFA00' else 'tpu-85a-tpu-90a'),preset='Bambu '+material+' @BBL P1P'))
products.sort(key=lambda p:(p['familyId'],p['colorCode']))
assert len(products)==36
catalog=dict(schema=1,version='2026-10-22',checkedAt='2026-10-22',sourceUrl=f'https://github.com/bambulab/BambuStudio/blob/{commit}/resources/profiles/BBL/filament/filaments_color_codes.json',sourceCommit=commit,sourceSha256=hashlib.sha256(Path('work/materials-v2/color_codes.json').read_bytes()).hexdigest(),scope='Bambu Studio 官方产品色表；不含实时库存、价格或跨地区商品变体。产品色号不等于电商 SKU。',products=products)
(assets/'catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2))
# Whitelist comes from the exact source application's tagged configuration schema.
def names(file,start):
 s=Path(file).read_text().split(start,1)[1].split('};',1)[0]
 s=re.sub(r'/\*.*?\*/','',s,flags=re.S);s=re.sub(r'//[^\n]*','',s)
 return set(re.findall(r'"(\w+)"',s))
keys=names('work/materials-v2/tag-Preset.cpp','s_Preset_filament_options {')
variant=names('work/materials-v2/tag-PrintConfig.cpp','filament_options_with_variant = {')
with zipfile.ZipFile(source) as z:d=json.loads(z.read('Metadata/project_settings.config'))
keys.update(k for k in d if k.startswith('filament_'))
chunks={}
for key in keys:
 v=d.get(key)
 if not isinstance(v,list) or key=='filament_self_index':continue
 if key=='filament_dev_ams_drying_ams_limitations':
  assert v==['1','0','1','0','1','0','1'];chunks[key]=[2,2,2,1]
 else:
  assert len(v)%4==0,(key,len(v))
  chunks[key]=[len(v)//4]*4
# Explicit source snapshots keep the adapter fixed to this reviewed project and version.
schema=dict(sourceSha256=catalog['sourceSha256'],bambuVersion='02.08.02.61',sourceUrl='https://github.com/bambulab/BambuStudio/tree/v02.08.02.61',filamentChunks=chunks,variantKeys=sorted(variant),notes='Per-filament chunks; AMS limitation vectors are variable length in the source. No printer/process vectors are inferred from their lengths.')
(assets/'export-schema.json').write_text(json.dumps(schema,indent=2))
print('Catalogue',len(products),'per-filament fields',len(chunks))
