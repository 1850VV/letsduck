"""Select local official presets; never fetch profiles while exporting a design."""
import json,re
from pathlib import Path

def load_profiles(assets):
    path=Path(assets)/'filament-profiles.json'
    return json.loads(path.read_text()) if path.is_file() else {'profiles':{}}

def normalized(value):
    return re.sub('[^a-z0-9+]','',str(value).lower())

def resolve_profile(product,data):
    material=product['material']
    suffix=next((tag for tag in ['CF','GF'] if re.search(r'\b'+tag+r'\d*\b',product.get('series',''),re.I)),None)
    material_type=material+('-'+suffix if suffix and not material.endswith('-'+suffix) else '')
    if material=='TPU' and str(product.get('hardness') or product.get('series','')).endswith('90A'):
        return dict(status='source-tpu90a',name='Source TPU 90A',type='TPU',settings={})
    profiles=list(data.get('profiles',{}).values())
    brand=product.get('brand','').replace('Bambu Lab','Bambu')
    identities={normalized(brand+' '+product['series'])}
    if normalized(product['series']).startswith(normalized(brand)):identities.add(normalized(product['series']))
    exact=[p for p in profiles if normalized(p['name'].split(' @')[0]) in identities]
    family={'PA6':'PA','PA12':'PA','PA612':'PA','PAHT':'PA','CoPA':'PA'}.get(material,material)
    generic_types=[material_type]+([family+('-'+suffix if suffix else '')] if family!=material else [])
    generic=[p for p in profiles if normalized(p['name'].split(' @')[0]) in {normalized('Generic '+kind) for kind in generic_types}]
    for status,choices in [('official-product',exact),('official-generic',generic)]:
        if choices:
            chosen=sorted(choices,key=lambda p:not p.get('compatibleP1P',False))[0]
            return dict(status=status,name=chosen['name'],type=(chosen['settings'].get('filament_type') or [material_type])[0],sourceUrl=chosen.get('sourceUrl'),compatibleP1P=chosen.get('compatibleP1P',False),settings=chosen['settings'])
    return dict(status='unavailable',name=product['series'],type=material_type,settings={})
