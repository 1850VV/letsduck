"""Synthetic catalogue fixtures, not manufacturer colour data."""
import json
import sys
import tempfile
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'backend'))
from filaments import load_catalog, compatible_product

class FilamentTests(unittest.TestCase):
    def test_support_role_is_rejected_even_when_family_is_structural(self):
        for series,family in [('PolySupport for PLA','PLA'),('PolySupport for PA12','PA12')]:
            self.assertFalse(compatible_product('PLA Basic',{'id':'support','brand':'Example','series':series,'material':family,'hex':'#FFFFFF'}))
    def test_optional_catalog_keeps_legacy_product_and_excludes_missing_hex(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)
            legacy=dict(id='legacy',brand='Example',series='PLA Basic',material='PLA',name='Legacy',hex='#123456',preset='Original')
            (root/'catalog.json').write_text(json.dumps(dict(version='base',products=[legacy])))
            self.assertEqual(load_catalog(root)['products'],[legacy])
            newer=dict(legacy,id='new',series='PLA-CF')
            pending=dict(newer,id='pending',hex=None,selectable=False)
            (root/'filament-catalog.json').write_text(json.dumps(dict(version='extended',products=[dict(legacy,hex='#FFFFFF'),newer,pending])))
            result=load_catalog(root)
            self.assertEqual(result['products'],[legacy,newer])
            self.assertEqual(result['pendingProducts'],[pending])
            self.assertEqual(result['version'],'extended')

    def test_material_family_and_hardness_are_independent_of_brand(self):
        product=dict(id='example',brand='Example',series='PLA-CF',material='PLA',hex='#123456')
        self.assertTrue(compatible_product('PLA Basic',product))
        self.assertFalse(compatible_product('TPU 90A',product))
        product.update(material='TPU',hardness='90A',series='Example Flex')
        self.assertTrue(compatible_product('TPU 90A',product))
        product['hardness']='95A'
        self.assertFalse(compatible_product('TPU 90A',product))

    def test_missing_or_demo_colours_and_support_are_excluded(self):
        product=dict(id='example',series='PLA',material='PLA',hex='#123456')
        for patch in [dict(hex=None),dict(selectable=False),dict(demo=True),dict(material='SUPPORT')]:
            self.assertFalse(compatible_product('PLA Basic',dict(product,**patch)))
