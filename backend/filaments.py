"""Manufacturer catalogue support. Data remains in the user's local asset pack."""
import json
import re
from pathlib import Path

RIGID={'PLA','PETG','PET','ABS','ASA','PC','PC-ABS','PA','PA6','PA12','PA612','PAHT','PPA','PPS','PEEK','PP','HIPS','PVB','PBT','CoPA','CoPE'}

def hardness(value):
    match=re.search(r'\b(\d+(?:\.\d+)?[AD])\b',str(value or ''),re.I)
    return match[1].upper() if match else None

def selectable(product):
    return not product.get('demo') and product.get('selectable') is not False and bool(re.fullmatch(r'#[\da-f]{6}',str(product.get('hex') or ''),re.I))

def compatible_product(material,product):
    if not product or not selectable(product):return False
    if product.get('role')=='support' or re.search(r'support|支撑|支撐',product.get('series',''),re.I):return False
    family=product.get('material') or re.split(r'[ -]',product.get('series',''))[0]
    if str(material).startswith('TPU'):
        required=hardness(material)
        return family=='TPU' and bool(required) and hardness(product.get('hardness') or product.get('series'))==required
    return family in RIGID

def load_catalog(assets):
    assets=Path(assets)
    base=json.loads((assets/'catalog.json').read_text())
    path=assets/'filament-catalog.json'
    if not path.is_file():return base
    extra=json.loads(path.read_text())
    known={p['id']:p for p in base['products']}
    pending=[]
    for product in extra['products']:
        if not selectable(product):pending.append(product)
        elif product['id'] not in known:known[product['id']]=product
    return {**base,**{k:extra[k] for k in ['version','scope','summary'] if k in extra},'checkedAt':extra.get('checkedAt'),
            'products':list(known.values()),'pendingProducts':pending,
            'extension':{k:extra[k] for k in ['version','checkedAt','scope','summary'] if k in extra}}
