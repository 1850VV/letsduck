"""Physical inventory declarations, independent of firmware commands and history."""
import json
from pathlib import Path
from rules import Invalid

ASSEMBLY = Path(__file__).resolve().parents[1] / 'frontend' / 'assemble'
IDS = {b['id'] for b in json.loads((ASSEMBLY / 'servo-map.json').read_text())['bindings']}
CATALOG = json.loads((ASSEMBLY / 'servo-leads.json').read_text())


def validated_updates(body):
    ids = body.get('ids')
    if (not isinstance(ids, list) or not ids or
            any(type(sid) is not int or sid not in IDS for sid in ids) or len(ids) != len(set(ids))):
        raise Invalid('请选择有效且不重复的舵机编号。')
    values = {}
    if 'state' in body:
        if body['state'] not in ('available', 'picked', 'installed'):
            raise Invalid('取件状态不正确。')
        values['state'] = body['state']
    if 'preparedLeads' in body:
        prepared = body['preparedLeads']
        if (len(ids) != 1 or not isinstance(prepared, list) or
                any(not isinstance(key, str) for key in prepared) or len(set(prepared)) != len(prepared)):
            raise Invalid('预接线记录不正确。')
        connections = CATALOG['requirements'][str(ids[0])]['connections'] or []
        allowed = {lead['key'] for lead in connections if lead.get('sourceStatus') == 'confirmed'
                   and lead.get('cableClass') in ('long', 'standard') and lead.get('to')
                   and type(lead.get('lengthMm')) in (int, float) and lead['lengthMm'] > 0}
        if any(key not in allowed for key in prepared):
            raise Invalid('线材规格尚未核定，不能记为已备好。')
        values['preparedLeads'] = prepared
    if not values:
        raise Invalid('没有要保存的取件或预接线记录。')
    return [dict(id=sid, **values) for sid in ids]
