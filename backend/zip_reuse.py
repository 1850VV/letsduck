"""Reuse unmodified ZIP local records, rebuilding offsets and the central directory.

No custom compression and no extraction to disk. ZIP64 / split archives retain
Python's conventional writer as a conservative compatibility fallback.
"""
import copy
import io
import struct
import zipfile


def _records(data, archive):
    infos = archive.infolist()
    if len(infos) >= 65535 or len({i.filename for i in infos}) != len(infos):
        raise ValueError('Unsupported entry count or duplicate names')
    offsets = sorted(i.header_offset for i in infos) + [archive.start_dir]
    ends = dict(zip(offsets, offsets[1:]))
    pos = archive.start_dir
    result = {}
    for info in infos:
        if data[pos:pos + 4] != b'PK\x01\x02':
            raise ValueError('Invalid central directory')
        name, extra, comment, disk = struct.unpack_from('<4H', data, pos + 28)
        end = pos + 46 + name + extra + comment
        if disk or end > len(data) or max(info.file_size, info.compress_size, info.header_offset) >= 0xffffffff:
            raise ValueError('ZIP64 or split archive')
        fields = data[pos + 46 + name:pos + 46 + name + extra]
        at = 0
        while at < len(fields):
            kind, size = struct.unpack_from('<HH', fields, at)
            if kind == 1: raise ValueError('ZIP64 extra')
            at += 4 + size
        start = info.header_offset
        if data[start:start + 4] != b'PK\x03\x04':
            raise ValueError('Invalid local record')
        result[info.filename] = (data[start:ends[start]], data[pos:end])
        pos = end
    return result


def repack_zip(source, replacements):
    """Replace/add named entries; retain every other compressed byte and CRC."""
    with zipfile.ZipFile(io.BytesIO(source)) as original:
        # Let the standard writer construct the changed records and their CRCs.
        small = io.BytesIO()
        with zipfile.ZipFile(small, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as changed:
            for name, data in replacements.items():
                info = original.getinfo(name) if name in original.NameToInfo else name
                changed.writestr(copy.copy(info), data)
        try:
            old = _records(source, original)
            with zipfile.ZipFile(io.BytesIO(small.getvalue())) as changed:
                new = _records(small.getvalue(), changed)
        except (ValueError, struct.error):
            output = io.BytesIO()
            with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
                archive.comment = original.comment
                for info in original.infolist():
                    data = replacements[info.filename] if info.filename in replacements else original.read(info.filename)
                    archive.writestr(copy.copy(info), data)
                for name in replacements.keys() - original.NameToInfo.keys(): archive.writestr(name, replacements[name])
            return output.getvalue()
        output, central = bytearray(), bytearray()
        for name in [*old, *(name for name in new if name not in old)]:
            local, directory = new.get(name, old.get(name))
            record = bytearray(directory)
            struct.pack_into('<I', record, 42, len(output))
            output.extend(local)
            central.extend(record)
        start = len(output)
        output.extend(central)
        count = len(old.keys() | new.keys())
        output.extend(struct.pack('<4s4H2IH', b'PK\x05\x06', 0, 0, count, count, len(central), start, len(original.comment)))
        output.extend(original.comment)
        return bytes(output)
