from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
from collections import Counter
import json,hashlib,shutil,re,xml.etree.ElementTree as E
from PIL import Image,ImageDraw,ImageFont
from pypdf import PdfReader

ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'outputs'/'XGO_Duck_DeepSeek'
D=json.loads((OUT/'BOM_and_all_source_parameters.json').read_text());V=json.loads((OUT/'verification.json').read_text())
font=lambda n:ImageFont.truetype('/Library/Fonts/Arial Unicode.ttf',n)
im=Image.new('RGB',(2400,2400),'#EDF2F8');dr=ImageDraw.Draw(im)
dr.text((48,28),'XGO Duck V2 | DeepSeek 蓝白黑逐板配色',font=font(63),fill='#142B4E')
dr.text((52,116),'读取原始 3MF 网格及摆放 | 6 板 / 25 对象 / 35 零件实例 | 品牌蓝参考 #4D6BFE',font=font(28),fill='#52627A')
for p in D['plates']:
    n=p['plate'];x=40+(n-1)%3*788;y=185+(n-1)//3*1065;pp=p['parts'];r=pp[0]
    dr.rounded_rectangle((x,y,x+752,y+1020),radius=22,fill='white',outline='#CDDAE8',width=2)
    dr.text((x+24,y+19),f'第 {n} 板  {r["new_color_name"]} {r["material"]}',font=font(36),fill='#142B4E')
    dr.text((x+24,y+68),f'{len(pp)} 件 · 材料槽 {r["slot"]} · '+('原名 '+p['original_name'] if p['original_name'] else '原板未命名'),font=font(23),fill='#52627A')
    a=Image.open(OUT/f'Plate_{n}_map.png');a=a.resize((610,610),Image.Resampling.LANCZOS);im.paste(a,(x+70,y+110))
    yy=y+737
    for r in pp:
        dr.text((x+25,yy),r['code'].split('-')[1]+'  '+r['part_name'],font=font(25),fill='#142B4E');yy+=29
dr.text((50,2335),'主文件保留 TPU 90A；95A 替代需重选预设并试装。图示为真实网格渲染，不代表实打或装配验收。',font=font(26),fill='#52627A')
im.save(OUT/'All_6_plates_overview.png')
for n in range(1,7):shutil.copy2(ROOT/'work'/'pdf_render'/f'page_{n+1:02d}.png',OUT/f'Plate_{n}_annotated.png')

# Independent read-back of the delivered files, beyond authoring-script assertions.
with ZipFile(OUT/'XGO_Duck_V2_original.3mf') as orig,ZipFile(OUT/'XGO_Duck_DeepSeek_preserve_TPU90A.3mf') as mod:
    assert orig.testzip() is None and mod.testzip() is None
    assert orig.namelist()==mod.namelist()
    changed=[n for n in orig.namelist() if orig.read(n)!=mod.read(n)]
    assert changed==['Metadata/project_settings.config']
    old=json.loads(orig.read(changed[0]));new=json.loads(mod.read(changed[0]))
    assert [k for k in old if old[k]!=new[k]]==['filament_colour','filament_multi_colour']
    assert new['filament_colour']==new['filament_multi_colour']==['#FFFFFF','#000000','#0056B8','#000000']
    r=E.fromstring(mod.read('Metadata/model_settings.config'))
    assert len(r.findall('plate'))==6 and len(r.findall('object'))==25
    assert sum(len(o.findall('part')) for o in r.findall('object'))==35
    # Verify that every recorded instance resolves to an existing component and metadata name.
    actual={o.get('id'):o for o in r.findall('object')}
    for p in D['plates']:
        for part in p['parts']:
            o=actual[str(part['object_id'])];node=o.findall('part')[part['part_index']]
            assert node.get('id')==str(part['part_id']) and node.get('uuid')==part['part_uuid']
            assert next(m.get('value') for m in node.findall('metadata') if m.get('key')=='name')==part['part_name']
    extra=Counter()
    for n in orig.namelist():
        if n.endswith('.model'):
            t=E.fromstring(orig.read(n))
            for tri in t.iter('{http://schemas.microsoft.com/3dmanufacturing/core/2015/02}triangle'):
                extra.update({k+':'+v:1 for k,v in tri.attrib.items() if k not in ['v1','v2','v3']})
    V['original_face_attributes_preserved']=dict(extra)

reader=PdfReader(OUT/'XGO_Duck_DeepSeek_printing_guide.pdf');assert len(reader.pages)==10
for n,p in enumerate(D['plates'],start=1):
    text=re.sub(r'\s+','',reader.pages[n].extract_text())
    for name,count in Counter(x['part_name'] for x in p['parts']).items():
        assert text.count(re.sub(r'\s+','',name))==count,(n,name,count)
for n in range(1,7):
    with Image.open(OUT/f'Plate_{n}_annotated.png') as p: p.verify()
V.update({'pdf_page_count':10,'all_35_instance_names_reconciled_to_pdf':True,
          'all_6_annotated_images_rendered_and_decoded':True,'pdf_visual_inspection':'PASS - 10-page contact sheet; dense pages inspected at full size',
          'original_backup_sha256_matches_source':hashlib.sha256((OUT/'XGO_Duck_V2_original.3mf').read_bytes()).hexdigest()==V['source_sha256']})
(OUT/'verification.json').write_text(json.dumps(V,ensure_ascii=False,indent=2))
assert V['original_backup_sha256_matches_source']
manifest=[]
for p in sorted(OUT.iterdir()):
    if p.is_file() and p.name!='SHA256SUMS.txt':manifest.append(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.name)
(OUT/'SHA256SUMS.txt').write_text('\n'.join(manifest)+'\n')
archive=ROOT/'outputs'/'XGO_Duck_DeepSeek_delivery.zip'
with ZipFile(archive,'w',ZIP_DEFLATED,compresslevel=9) as z:
    for p in sorted(OUT.iterdir()):
        if p.is_file():z.write(p,OUT.name+'/'+p.name)
with ZipFile(archive) as z:assert z.testzip() is None
print(json.dumps({'archive':str(archive),'archive_bytes':archive.stat().st_size,'files':len(list(OUT.iterdir())),
                  'acceptance':V},ensure_ascii=False,indent=2))
