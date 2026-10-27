"""Profile selection uses synthetic data; public source ships no vendor presets."""
import sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'backend'))
from material_profiles import resolve_profile
class ProfileTests(unittest.TestCase):
    def setUp(self):
        self.db={'profiles':{'Generic PETG @BBL P1P':{'name':'Generic PETG @BBL P1P','compatibleP1P':True,'sourceUrl':'https://example.test/petg','settings':{'filament_type':['PETG'],'nozzle_temperature':['247']}},'Generic PLA-CF @BBL P1P':{'name':'Generic PLA-CF @BBL P1P','compatibleP1P':True,'settings':{'filament_type':['PLA-CF']}}}}
    def test_generic_profile_keeps_actual_polymer_and_carbon_type(self):
        p=resolve_profile({'brand':'Example','series':'PETG+','material':'PETG'},self.db)
        self.assertEqual(p['settings']['nozzle_temperature'],['247']);self.assertEqual(p['status'],'official-generic')
        cf=resolve_profile({'brand':'Example','series':'PLA-CF','material':'PLA','finish':'carbon'},self.db)
        self.assertEqual(cf['type'],'PLA-CF')
    def test_exact_brand_profile_wins_and_soft_parts_keep_source_90a(self):
        exact={'name':'Example PETG+ @BBL P1P','compatibleP1P':True,'settings':{'filament_type':['PETG'],'nozzle_temperature':['251']}}
        self.db['profiles'][exact['name']]=exact
        self.assertEqual(resolve_profile({'brand':'Example','series':'PETG+','material':'PETG'},self.db)['status'],'official-product')
        self.assertEqual(resolve_profile({'brand':'Example','series':'TPU 90A','material':'TPU','hardness':'90A'},self.db)['status'],'source-tpu90a')
    def test_unknown_profile_is_explicit_instead_of_borrowing_pla(self):
        p=resolve_profile({'brand':'Example','series':'PEEK','material':'PEEK'},self.db)
        self.assertEqual(p['status'],'unavailable');self.assertEqual(p['settings'],{})
