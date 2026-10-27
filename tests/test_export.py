"""Run: python3 -m unittest discover -s tests -v"""
import base64, copy, hashlib, io, json, struct, sys, unittest, zipfile, zlib
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'backend'))
import exporter as e

def png():
    def chunk(tag,data):return struct.pack('>I',len(data))+tag+data+struct.pack('>I',zlib.crc32(tag+data)&0xffffffff)
    image=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',512,512,8,2,0,0,0))+chunk(b'IDAT',zlib.compress((b'\0'+b'\xff\xff\xff'*512)*512))+chunk(b'IEND',b'')
    return 'data:image/png;base64,'+base64.b64encode(image).decode()
def payload():
    image=png()
    return dict(source_sha256=e.MODEL['source_sha256'],assignments={p['id']:next(x['id'] for x in e.PRODUCTS.values() if x['series']==p['material'] and x['hex']==p['color']) for p in e.PARTS.values()},thumbnails={name:image for name in ['cover']+[f'{k}{i}' for k in ['plate','top'] for i in range(1,7)]})
class ExportTests(unittest.TestCase):
    def test_real_brand_native_metadata_and_generic_parameters_survive_export(self):
        from unittest.mock import patch
        sample={'id':'sample-petg','brand':'Example','series':'PETG+','material':'PETG','name':'Two colours','colorCode':'A7','hex':'#123456','colors':['#123456','#FEDCBA'],'finish':'basic','sourceUrl':'https://example.test/colour'}
        profile={'name':'Generic PETG @BBL P1P','compatibleP1P':True,'sourceUrl':'https://example.test/profile','settings':{'filament_type':['PETG'],'nozzle_temperature':['247']}}
        with patch.dict(e.PRODUCTS,{sample['id']:sample}),patch.dict(e.PROFILE_DATA,{'profiles':{profile['name']:profile}},clear=True):
            p=payload();p['assignments']['P2-03']=sample['id'];result,report=e.export_3mf(p)
            z=zipfile.ZipFile(io.BytesIO(result));config=json.loads(z.read('Metadata/project_settings.config'));slot=next(s for s in report['slots'] if s['product']['id']==sample['id']);i=slot['slot']-1
            self.assertEqual(config['filament_vendor'][i],'Example');self.assertEqual(config['filament_type'][i],'PETG')
            self.assertIn('PETG+',config['filament_settings_id'][i]);self.assertIn('A7',config['filament_settings_id'][i])
            self.assertEqual(config['filament_multi_colour'][i],'#123456 #FEDCBA');self.assertEqual(config['nozzle_temperature'][-2:],['247','247'])
            self.assertEqual(slot['profile']['status'],'official-generic');self.assertEqual(report['parts'][next(j for j,r in enumerate(report['parts']) if r['id']=='P2-03')]['product'],sample)
            self.assertTrue(all(z.read(n)==e.SOURCE_ZIP.read(n) for n in z.namelist() if n.startswith('3D/')))
    def test_missing_profile_allows_truthful_bom_but_rejects_unconfigured_3mf(self):
        from unittest.mock import patch
        sample={'id':'sample-peek','brand':'Example','series':'PEEK','material':'PEEK','name':'Natural','hex':'#123456'}
        with patch.dict(e.PRODUCTS,{sample['id']:sample}),patch.dict(e.PROFILE_DATA,{'profiles':{}},clear=True):
            p=payload();p['assignments']['P2-03']=sample['id'];report=e.plan(p)
            self.assertEqual(report['slots'][-1]['profile']['status'],'unavailable')
            with self.assertRaisesRegex(e.InvalidDesign,'PEEK'):e.export_3mf(p)
    def test_baseline_preserves_all_geometry_and_process_settings(self):
        result,report=e.export_3mf(payload());z=zipfile.ZipFile(io.BytesIO(result))
        self.assertEqual(len(report['slots']),4)
        changed=[n for n in e.SOURCE_ZIP.namelist() if z.read(n)!=e.SOURCE_ZIP.read(n)]
        self.assertFalse(any(n.startswith('3D/') for n in changed))
        self.assertEqual(set(report['validation']['changedConfigurationKeys']),{'filament_colour','filament_multi_colour'})
        self.assertEqual(report['validation']['partCount'],35)
        self.assertEqual(json.loads(z.read('Metadata/duck_studio_materials.json'))['parts'],report['parts'])
        self.assertEqual(hashlib.sha256(e.SOURCE).hexdigest(),e.MODEL['source_sha256'])
    def test_new_PLA_TPU_slots_copy_source_profiles_and_variants(self):
        p=payload();p['assignments'].update({'P2-03':'bambu-GFA00-10200','P1-03':'bambu-GFU03-51601'})
        result,report=e.export_3mf(p);z=zipfile.ZipFile(io.BytesIO(result));config=json.loads(z.read('Metadata/project_settings.config'))
        # New slots appear in part order: TPU blue=5, PLA red=6.
        self.assertEqual(config['filament_type'],['PLA','PLA','PLA','TPU','TPU','PLA'])
        self.assertEqual(config['nozzle_temperature'],['220']*6+['225']*4+['220']*2)
        self.assertEqual(config['filament_self_index'],['1','1','2','2','3','3','4','4','5','5','6','6'])
        self.assertEqual(config['filament_dev_ams_drying_ams_limitations'],['1','0','1','0','1','0','1','1','1','0'])
        self.assertEqual(len(config['flush_volumes_matrix']),36)
        self.assertEqual(len(config['filament_dev_ams_drying_temperature']),24)
        self.assertIn('板 1',report['warnings'][0])
        self.assertEqual(config['machine_max_speed_x'],e.CONFIG['machine_max_speed_x'])
        self.assertEqual(config['different_settings_to_system'][0],e.CONFIG['different_settings_to_system'][0])
    def test_shared_mesh_instances_can_have_different_material_colors(self):
        p=payload();p['assignments']['P3-04']='bambu-GFA00-10200'
        result,report=e.export_3mf(p);z=zipfile.ZipFile(io.BytesIO(result));tree=e.ET.fromstring(z.read('Metadata/model_settings.config'))
        def slot(part_id):
            part=next(n for n in tree.findall('object/part') if n.get('uuid')==e.PARTS[part_id]['uuid'])
            return next(n.get('value') for n in part.findall('metadata') if n.get('key')=='extruder')
        self.assertEqual(e.PARTS['P3-04']['sourcePart'],e.PARTS['P3-05']['sourcePart'])
        self.assertNotEqual(slot('P3-04'),slot('P3-05'))
    def test_single_part_objects_synchronize_parent_slot_for_bambu(self):
        p=payload();p['assignments']['P2-03']='bambu-GFA00-10200'
        result,report=e.export_3mf(p);tree=e.ET.fromstring(zipfile.ZipFile(io.BytesIO(result)).read('Metadata/model_settings.config'))
        part=next(n for n in tree.findall('object/part') if n.get('uuid')==e.PARTS['P2-03']['uuid'])
        parent=next(o for o in tree.findall('object') if part in list(o))
        slot=lambda node: next(m.get('value') for m in node.findall('metadata') if m.get('key')=='extruder')
        self.assertEqual(slot(parent),slot(part))
        self.assertEqual(slot(part),'5')
        config=json.loads(zipfile.ZipFile(io.BytesIO(result)).read('Metadata/project_settings.config'))
        self.assertGreater(float(config['flush_volumes_matrix'][4]),0)
    def test_material_and_hardness_swap_rejected(self):
        for product in ['bambu-GFA00-10101','bambu-GFU00-51100']:
            p=payload();p['assignments']['P1-01']=product
            with self.assertRaises(e.InvalidDesign):e.plan(p)
    def test_unbound_unknown_source_or_incomplete_design_rejected(self):
        for change in ['unbound','missing','source','unknown']:
            p=payload()
            if change=='unbound':p['assignments']['P2-01']=None
            if change=='missing':del p['assignments']['P2-01']
            if change=='source':p['source_sha256']='wrong'
            if change=='unknown':p['assignments']['P2-01']='fake-brand-blue'
            with self.assertRaises(e.InvalidDesign):e.plan(p)
    def test_invalid_thumbnails_are_rejected(self):
        p=payload();p['thumbnails']['plate1']='data:image/png;base64,AAAA'
        with self.assertRaises(e.InvalidDesign):e.export_3mf(p)
    def test_bounded_palette_prevents_unsupported_export(self):
        p=payload();pla=[x['id'] for x in e.PRODUCTS.values() if x['material']=='PLA']
        for part,product in zip([x for x in e.PARTS.values() if x['material']=='PLA Basic'],pla):p['assignments'][part['id']]=product
        with self.assertRaises(e.InvalidDesign):e.plan(p)
if __name__=='__main__':unittest.main()
