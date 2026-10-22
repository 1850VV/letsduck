"""Design and scheme validation shared by both editions. Python standard library only (3.9+):
the personal edition imports this file without installing the server's dependencies."""
from errors import LocalizedError

FINISHES = {'basic', 'matte', 'silk', 'translucent', 'tpu'}
MAX_SCHEMES = 30


class Invalid(LocalizedError):
    """A request the client can fix."""


def validate_design(design, part_ids=()):
    if not isinstance(design, dict) or not isinstance(design.get('colors'), dict) or not isinstance(design.get('assignments'), dict):
        raise Invalid('配色数据格式不对', code='validation.1')
    colors, assignments = design['colors'], design['assignments']
    part_ids = set(part_ids or ())
    if part_ids and (set(colors) != part_ids or set(assignments) != part_ids):
        raise Invalid('配色必须包含全部 %d 个零件' % len(part_ids), code='validation.2', params={'v0': len(part_ids)})
    for value in colors.values():
        if not (isinstance(value, str) and len(value) == 7 and value[0] == '#' and all(c in '0123456789abcdefABCDEF' for c in value[1:])):
            raise Invalid('颜色格式不对', code='validation.18')
    for value in assignments.values():
        if value is not None and (not isinstance(value, str) or len(value) > 80):
            raise Invalid('耗材编号格式不对', code='validation.19')
    finishes = design.get('finishes') or {}
    if not isinstance(finishes, dict) or any(v not in FINISHES for v in finishes.values()):
        raise Invalid('质感格式不对', code='validation.3')
    return {'colors': {k: v.upper() for k, v in colors.items()}, 'assignments': assignments,
            'finishes': {k: v for k, v in finishes.items() if k in colors}}


def text(value, limit, field, required=True):
    value = str(value or '').strip()
    if required and not value:
        raise Invalid(field + '不能为空', code='validation.4', params={'v0': field})
    return value[:limit]


def scheme_values(sid, data, part_ids=()):
    """Checks a PUT /api/schemes/<sid> body; returns the stored name, design, provenance and voice salt."""
    if not isinstance(sid, str) or not 1 <= len(sid) <= 64:
        raise Invalid('方案编号不对', code='validation.9')
    return {'name': text(data.get('name'), 40, '方案名称'), 'design': validate_design(data.get('design'), part_ids),
            'provenance': data.get('provenance') or None, 'voiceSalt': int(data.get('voiceSalt') or 0)}
