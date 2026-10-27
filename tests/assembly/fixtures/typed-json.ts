import { finite, record } from '../../../frontend/assemble/servo-types.js';
import type { Vector, Port } from '../../../frontend/assemble/types.js';
const list = (v: unknown): unknown[] => { if (!Array.isArray(v))
    throw Error('Fixture list required'); return v; };
const text = (v: unknown): string => { if (typeof v !== 'string')
    throw Error('Fixture text required'); return v; };
const vector = (v: unknown): number[] => list(v).map(finite);
const optionalNumber = (v: unknown): number | undefined => v === undefined ? undefined : finite(v);
const numberMap = (v: unknown): Record<string, number> => Object.fromEntries(Object.entries(record(v)).map(([k, v]) => [k, finite(v)]));
export interface SourceHole {
    axis: number;
    face: number;
    residual: number;
    radius: number;
    center: Vector;
}
export function parseHoles(v: unknown): Record<string, SourceHole[]> { return Object.fromEntries(Object.entries(record(v)).map(([id, v]) => [id, list(v).map(v => { const h = record(v); return { axis: finite(h.axis), face: finite(h.face), residual: finite(h.residual), radius: finite(h.radius), center: vector(h.center) }; })])); }
interface AuditActor {
    nativePorts: (Port & {
        normal: Vector;
    })[];
    replaceOldPortSlotsWithNativeIndex: number[];
    existingHorn: null | {
        globalRemoveStep: number | null;
        actorId: string;
        screwActorId: string;
        newSeatedWorldMm: Vector;
        newDesiredQuaternionXYZW: Vector;
    };
}
export function parseAudit(v: unknown): {
    actors: Record<string, AuditActor>;
} { return { actors: Object.fromEntries(Object.entries(record(record(v).actors)).map(([id, v]) => { const a = record(v), h = a.existingHorn === null ? null : record(a.existingHorn); return [id, { nativePorts: list(a.nativePorts).map(v => { const p = record(v); return { position: vector(p.position), normal: vector(p.normal), ...(p.tangent === undefined ? {} : { tangent: vector(p.tangent) }) }; }), replaceOldPortSlotsWithNativeIndex: vector(a.replaceOldPortSlotsWithNativeIndex), existingHorn: h === null ? null : { globalRemoveStep: h.globalRemoveStep === null ? null : finite(h.globalRemoveStep), actorId: text(h.actorId), screwActorId: text(h.screwActorId), newSeatedWorldMm: vector(h.newSeatedWorldMm), newDesiredQuaternionXYZW: vector(h.newDesiredQuaternionXYZW) } }]; })) }; }
interface FixtureAccessor {
    bufferView: number;
    componentType: number;
    byteOffset?: number | undefined;
    count: number;
    type: string;
    normalized: boolean;
}
interface FixtureNode {
    name: string;
    mesh?: number | undefined;
    matrix?: number[];
    translation?: number[];
    rotation?: number[];
    scale?: number[];
    children: number[];
}
interface FixtureMaterial {
    name: string;
    pbrMetallicRoughness: {
        baseColorFactor?: number[];
        metallicFactor?: number | undefined;
        roughnessFactor?: number | undefined;
        baseColorTexture?: {
            index: number;
        };
    };
}
export function parseGltf(v: unknown) {
    const r = record(v);
    return {
        accessors: list(r.accessors).map((v): FixtureAccessor => { const a = record(v); return { bufferView: finite(a.bufferView), componentType: finite(a.componentType), byteOffset: optionalNumber(a.byteOffset), count: finite(a.count), type: text(a.type), normalized: a.normalized === true }; }),
        bufferViews: list(r.bufferViews).map(v => { const b = record(v); return { byteOffset: optionalNumber(b.byteOffset) }; }),
        textures: list(r.textures ?? []),
        materials: list(r.materials ?? []).map((v): FixtureMaterial => { const m = record(v), p = record(m.pbrMetallicRoughness ?? {}); return { name: text(m.name ?? ''), pbrMetallicRoughness: { ...(p.baseColorFactor === undefined ? {} : { baseColorFactor: vector(p.baseColorFactor) }), metallicFactor: optionalNumber(p.metallicFactor), roughnessFactor: optionalNumber(p.roughnessFactor), ...(p.baseColorTexture === undefined ? {} : { baseColorTexture: { index: finite(record(p.baseColorTexture).index) } }) } }; }),
        nodes: list(r.nodes).map((v): FixtureNode => { const n = record(v), out: FixtureNode = { name: text(n.name ?? ''), mesh: optionalNumber(n.mesh), children: vector(n.children ?? []) }; for (const k of ['matrix', 'translation', 'rotation', 'scale'] as const)
            if (n[k] !== undefined)
                out[k] = vector(n[k]); return out; }),
        meshes: list(r.meshes).map(v => ({ primitives: list(record(v).primitives).map(v => { const p = record(v); return { attributes: numberMap(p.attributes), indices: optionalNumber(p.indices), material: optionalNumber(p.material) }; }) })),
        scenes: list(r.scenes).map(v => ({ nodes: vector(record(v).nodes ?? []) })), scene: optionalNumber(r.scene),
    };
}
