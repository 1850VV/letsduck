import { finite, record } from './servo-types.js';
import type { Vector } from './types.js';
interface AssemblyPart extends Record<string,unknown> {
    sourceId:string;
    sourceName:string;
    id: string;
    positionOffset: number;
    indexOffset: number;
    vertexCount: number;
    indexCount: number;
    size: Vector;
    rotationZ?: number;
}
const count = (value: unknown): number => { const n = finite(value); if (!Number.isSafeInteger(n) || n < 0)
    throw Error('模型几何计数不正确'); return n; };
/** Validate the authored manifest before it reaches typed binary buffer views. */
export function parseAssemblyManifest(input: unknown): {
    parts: AssemblyPart[];
} {
    const data = record(input);
    if (!Array.isArray(data.parts))
        throw Error('模型零件清单不正确');
    return { ...data,parts: data.parts.map(value => {
            const p = record(value);
            if (typeof p.id !== 'string' || typeof p.sourceId !== 'string' || typeof p.sourceName !== 'string' || !Array.isArray(p.size) || p.size.length !== 3)
                throw Error('模型零件格式不正确');
            return { ...p,id: p.id,sourceId:p.sourceId,sourceName:p.sourceName, positionOffset: count(p.positionOffset), indexOffset: count(p.indexOffset), vertexCount: count(p.vertexCount), indexCount: count(p.indexCount), size: p.size.map(finite), ...(p.rotationZ === undefined ? {} : { rotationZ: finite(p.rotationZ) }) };
        }) };
}
