"""XGO Duck V2 adapter. Byte-preserve every mesh; edit only material assignments.
Bambu Studio 02.08.02.61 configuration layout, fixed to the reviewed source SHA.
No slicing, automatic profile replacement, hardware connection, or MCP.
"""
from pathlib import Path
from datetime import datetime, timezone
import base64, copy, hashlib, io, json, re, struct, zipfile
import xml.etree.ElementTree as ET

import os

ROOT = Path(__file__).resolve().parent
# Separately licensed local asset pack; mounted in Docker, ../assets during development.
ASSETS = Path(os.environ.get('DUCK_ASSETS', ROOT.parent / 'assets'))
MODEL = json.loads((ASSETS / 'model.json').read_text())
CATALOG = json.loads((ASSETS / 'catalog.json').read_text())
SCHEMA = json.loads((ASSETS / 'export-schema.json').read_text())
PRODUCTS = {p['id']: p for p in CATALOG['products']}
PARTS = {p['id']: p for p in MODEL['parts']}
SOURCE = (ASSETS / 'source.3mf').read_bytes()
assert hashlib.sha256(SOURCE).hexdigest() == MODEL['source_sha256']
SOURCE_ZIP = zipfile.ZipFile(io.BytesIO(SOURCE))
CONFIG = json.loads(SOURCE_ZIP.read('Metadata/project_settings.config'))
BASE_PRODUCTS = ['bambu-GFA00-10100', 'bambu-GFA00-10101', 'bambu-GFA00-10604', 'bambu-GFU03-51103']
MAX_SLOTS = 16

class InvalidDesign(ValueError):
    pass

def plan(payload):
    if not isinstance(payload, dict) or payload.get('source_sha256') != MODEL['source_sha256']:
        raise InvalidDesign('源模型不匹配，请刷新工作台后重试。')
    assignments = payload.get('assignments')
    if not isinstance(assignments, dict) or set(assignments) != set(PARTS):
        raise InvalidDesign('必须提供全部 35 个零件的耗材分配。')
    palette = list(BASE_PRODUCTS)
    rows = []
    for part_id, part in PARTS.items():
        product_id = assignments[part_id]
        product = PRODUCTS.get(product_id) if isinstance(product_id, str) else None
        if not product:
            raise InvalidDesign(f'{part_id} 尚未选择实际耗材；目标色不能直接作为产品导出。')
        if product['series'] != part['material']:
            raise InvalidDesign(f'{part_id} 必须保持 {part["material"]}，不能替换材料或硬度。')
        if product_id not in palette:
            palette.append(product_id)
        rows.append(dict(id=part_id, uuid=part['uuid'], name=part['name'], originalName=part['originalName'], plate=part['plate'], objectId=part['sourceObject'], partId=part['sourcePart'], slot=palette.index(product_id)+1, product=product))
    if len(palette) > MAX_SLOTS:
        raise InvalidDesign(f'本版最多支持 {MAX_SLOTS} 个耗材槽（包含原始 4 槽），请减少颜色后导出。')
    warnings = ['导出的是可编辑项目，不含切片 G-code。请在 Bambu Studio 中复核并重新切片。',
                'TPU 90A 沿用原硬度与参数，使用外置进料，不通过 P1P 的 AMS 进料。',
                '原 4 槽冲刷量沿用源表；新增颜色间用源表最大值作临时值。切片前须按新颜色重新计算冲刷量。',
                '官方色表用于屏幕预览，半透明外观为示意；未核验库存、价格或实物色差。']
    mixed = []
    for plate in range(1, 7):
        plate_rows = [r for r in rows if r['plate'] == plate]
        if len(set(r['product']['id'] for r in plate_rows)) > 1:
            mixed.append(plate)
    if 1 in mixed:
        warnings.insert(0, '板 1 含多种 TPU 颜色；这些软料不能通过 AMS 自动换色，需由商家拆分任务或另行安排换料。当前项目保留原摆放。')
    if any(p != 1 for p in mixed):
        warnings.append('部分 PLA 板包含多色，需要匹配实际 AMS / 换料方案并检查擦料塔。')
    return dict(schema='duck-studio-materials/2', name=str(payload.get('name', '我的方案'))[:100], createdAt=datetime.now(timezone.utc).isoformat(), source_sha256=MODEL['source_sha256'], sourceFile='XGO_duckV2.3mf', catalogue={k: CATALOG[k] for k in ['version','sourceUrl','sourceSha256','scope']}, sourceBambuVersion='02.08.02.61', plateCount=6, objectCount=25, partCount=35, slots=[dict(slot=i+1, sourceTemplateSlot=(i+1 if i < 4 else (4 if PRODUCTS[p]['material']=='TPU' else 1)), product=PRODUCTS[p], used=any(r['product']['id']==p for r in rows)) for i,p in enumerate(palette)], parts=rows, mixedColorPlates=mixed, warnings=warnings)

def remap_config(report):
    out = copy.deepcopy(CONFIG)
    templates = [s['sourceTemplateSlot']-1 for s in report['slots']]
    for key, sizes in SCHEMA['filamentChunks'].items():
        values = CONFIG[key]
        assert sum(sizes) == len(values), key
        chunks, offset = [], 0
        for size in sizes:
            chunks.append(values[offset:offset+size]); offset += size
        out[key] = [x for template in templates for x in chunks[template]]
    out['filament_self_index'] = [str(i+1) for i,t in enumerate(templates) for _ in range(SCHEMA['filamentChunks']['filament_extruder_variant'][t])]
    for key in ['filament_colour', 'filament_multi_colour']:
        out[key] = [s['product']['hex'] for s in report['slots']]
    # These are the only mixed print/filament/printer arrays present in this source.
    for key in ['different_settings_to_system','inherits_group','compatible_machine_expression_group']:
        if key in CONFIG:
            old = CONFIG[key]
            assert len(old) == 6, key
            out[key] = old[:1] + [old[t+1] for t in templates] + old[-1:]
    if 'compatible_process_expression_group' in CONFIG:
        old = CONFIG['compatible_process_expression_group']; assert len(old)==4
        out['compatible_process_expression_group'] = [old[t] for t in templates]
    old = CONFIG['flush_volumes_matrix']
    # Avoid zero purge between different new colors copied from the same template.
    # This is a conservative placeholder, never a claim of calibrated purge volume.
    maximum = str(max(float(v) for v in old)).removesuffix('.0')
    out['flush_volumes_matrix'] = [('0' if i==j else (old[a*4+b] if i<4 and j<4 else maximum)) for i,a in enumerate(templates) for j,b in enumerate(templates)]
    out['flush_volumes_vector'] = [x for t in templates for x in CONFIG['flush_volumes_vector'][t*2:t*2+2]]
    return out

def remap_objects(report):
    text = SOURCE_ZIP.read('Metadata/model_settings.config').decode('utf-8')
    slots = {row['uuid']:row['slot'] for row in report['parts']}
    seen = set()
    def replace(match):
        block = match.group(0)
        uuid = re.search(r'\buuid="([^"]+)"', block).group(1)
        if uuid not in slots or uuid in seen:
            raise InvalidDesign('源零件标识重复或不匹配。')
        seen.add(uuid)
        tag = f'<metadata key="extruder" value="{slots[uuid]}"/>'
        if re.search(r'<metadata\s+key="extruder"[^>]*/>', block):
            return re.sub(r'<metadata\s+key="extruder"[^>]*/>', tag, block)
        return block.replace('</part>', '  '+tag+'\n    </part>')
    text = re.sub(r'<part\b[^>]*>.*?</part>', replace, text, flags=re.S)
    assert seen == set(slots)
    # Bambu collapses a one-volume object's extruder to its object configuration.
    # Synchronize every object to its first part; explicit volume assignments retain
    # per-part differences in multi-volume objects.
    def replace_object(match):
        block=match.group(0)
        uuid=re.search(r'<part\b[^>]*\buuid="([^"]+)"',block).group(1)
        boundary=block.index('<part ')
        prefix=re.sub(r'<metadata\s+key="extruder"[^>]*/>',f'<metadata key="extruder" value="{slots[uuid]}"/>',block[:boundary])
        return prefix+block[boundary:]
    text=re.sub(r'<object\b[^>]*>.*?</object>',replace_object,text,flags=re.S)
    return text.encode('utf-8')

def thumbnail_bytes(value):
    if not isinstance(value,str) or not value.startswith('data:image/png;base64,'):
        raise InvalidDesign('导出缩略图缺失，请等待模型载入后重试。')
    try:
        data = base64.b64decode(value.split(',',1)[1], validate=True)
        if len(data)>600000 or data[:8]!=b'\x89PNG\r\n\x1a\n' or struct.unpack('>II',data[16:24])!=(512,512):
            raise ValueError()
    except (ValueError,struct.error):
        raise InvalidDesign('缩略图格式无效。')
    return data

def verify_result(result, report, expected_config):
    target = zipfile.ZipFile(io.BytesIO(result))
    geometry = [n for n in SOURCE_ZIP.namelist() if n.startswith('3D/')]
    assert all(SOURCE_ZIP.read(n)==target.read(n) for n in geometry), 'geometry changed'
    assert json.loads(target.read('Metadata/project_settings.config'))==expected_config
    source_xml = ET.fromstring(SOURCE_ZIP.read('Metadata/model_settings.config'))
    output_xml = ET.fromstring(target.read('Metadata/model_settings.config'))
    assert len(output_xml.findall('plate'))==6
    assert len(output_xml.findall('object'))==25
    xml_parts=output_xml.findall('object/part')
    assert len(xml_parts)==35
    slots={p['uuid']:p['slot'] for p in report['parts']}
    for part in xml_parts:
        metadata={m.get('key'):m.get('value') for m in part.findall('metadata')}
        assert int(metadata['extruder'])==slots[part.get('uuid')]
    for tree in [source_xml,output_xml]:
        for part in tree.findall('object/part')+tree.findall('object'):
            for meta in part.findall('metadata'):
                if meta.get('key')=='extruder':part.remove(meta)
        for el in tree.iter():el.text=None;el.tail=None
    assert ET.tostring(source_xml)==ET.tostring(output_xml), 'non-material structure changed'
    changed=[k for k in CONFIG if CONFIG[k]!=expected_config[k]]
    allowed=set(SCHEMA['filamentChunks'])|{'filament_self_index','flush_volumes_matrix','flush_volumes_vector','different_settings_to_system','inherits_group','compatible_machine_expression_group','compatible_process_expression_group'}
    assert set(changed)<=allowed
    return dict(status='passed',source_sha256=MODEL['source_sha256'],geometryEntriesByteIdentical=len(geometry),plateCount=6,objectCount=25,partCount=35,nonMaterialObjectMetadataUnchanged=True,changedConfigurationKeys=sorted(changed),sliced=False,physicalPrintVerified=False)

def export_3mf(payload):
    report = plan(payload)
    config = remap_config(report)
    replacements = {'Metadata/project_settings.config':json.dumps(config,ensure_ascii=False,indent=4).encode(), 'Metadata/model_settings.config':remap_objects(report)}
    thumbs=payload.get('thumbnails')
    if not isinstance(thumbs,dict) or set(thumbs)!={'cover',*[f'{kind}{i}' for kind in ['plate','top'] for i in range(1,7)]}:
        raise InvalidDesign('缺少当前方案的完整缩略图。')
    for i in range(1,7):
        plate=thumbnail_bytes(thumbs[f'plate{i}']);top=thumbnail_bytes(thumbs[f'top{i}'])
        for name in [f'Metadata/plate_{i}.png',f'Metadata/plate_no_light_{i}.png']:replacements[name]=plate
        replacements[f'Metadata/top_{i}.png']=top
    cover=thumbnail_bytes(thumbs['cover'])
    for name in SOURCE_ZIP.namelist():
        if name.startswith('Auxiliaries/.thumbnails/') and name.endswith('.png'):replacements[name]=cover
    report['previewNote']='板图与封面由当前网格和已选耗材重新渲染。Auxiliaries 中原作者的 Model/Profile Pictures 属于历史参考，未改写。拾取 ID 图保留原版。'
    report['preservationNote']='原始 4 槽保留，新颜色追加同材料模板；材质、硬度、流量、温度等参数按原槽复制。产品识别信息写入本清单。'
    content_types=SOURCE_ZIP.read('[Content_Types].xml').decode().replace('</Types>',' <Override PartName="/Metadata/duck_studio_materials.json" ContentType="application/json"/>\n</Types>')
    replacements['[Content_Types].xml']=content_types.encode()
    def pack():
        memory=io.BytesIO()
        with zipfile.ZipFile(memory,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as out:
            for info in SOURCE_ZIP.infolist():out.writestr(copy.copy(info),replacements.get(info.filename,SOURCE_ZIP.read(info.filename)))
            out.writestr('Metadata/duck_studio_materials.json',json.dumps(report,ensure_ascii=False,indent=2).encode())
        return memory.getvalue()
    result=pack()
    report['validation']=verify_result(result,report,config)
    return pack(),report
