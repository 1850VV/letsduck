import type { Design as ContractDesign, FilamentProduct, Finish } from '@letsduck/contracts';

export type { Finish };
export type Design = ContractDesign;
export type WireInteger = number | bigint;
export type Vec3 = [number, number, number];
export type Matrix3x4 = [number[], number[], number[]];
export interface GeometryLayout { positionOffset: number; indexOffset: number; vertexCount: number; indexCount: number }
export interface GeometryPart { id: string; geometry: GeometryLayout; printPositionOffset: number }
export interface GeometryHardware { name: string; geometry: GeometryLayout }
export interface GeometryModel { parts: GeometryPart[]; hardware: GeometryHardware[]; source_sha256?: string }
export interface ModelPart extends GeometryPart {
  uuid: string; name: string; originalName: string; material: string; color: string;
  plate: number; sourceObject: number; sourcePart: number;
  group?: string; pair?: string|null;
  assemblyEvidence?: {link?:string};
}
export interface Hardware extends GeometryHardware { color: string }
export interface ModelManifest extends GeometryModel { source_sha256: string; parts: ModelPart[]; hardware: Hardware[] }
export type Part = ModelPart;
export type Product = FilamentProduct & { name: string; hex: string; alpha?: number; finish?: string };
export interface Catalog { products: Product[]; version?: string }
export interface PositionMetadata {
  id: string; kind: 'part' | 'hardware'; vertices: number; triangles: number; bits: number;
  min: number[]; scale: number[]; v: number[]; i: number[]; printMatrix?: Matrix3x4;
  printMatrix64?: number[];
}
export interface DecodedMesh extends PositionMetadata { positions: Float32Array; indices: Uint32Array }
export interface PreparedMesh extends DecodedMesh { normals: Float32Array }
export interface PreparedGeometry { positions: Float32Array; normals: Float32Array; indices: Uint32Array }
export interface ModelData {
  model: ModelManifest; catalog: Catalog; geometry: Map<string, PreparedMesh> | null; binary: ArrayBuffer | null;
  loadLegacy(): Promise<ArrayBuffer>; loadPrintGeometry(): Promise<Map<string, PreparedMesh>>;
}
export interface DuckData extends ModelData { products: Map<string, Product> }
export interface User { id: string; name: string; avatar: string; color: string; created: WireInteger }
export type PublicAuthor=Pick<User,'id'|'name'|'avatar'|'color'>;
export interface AuthResult { token: string; user: User }
export interface Provenance { workId?: string; title: string; author: string }
export interface Scheme { id: string; name: string; design: Design; provenance: unknown; voiceSalt: WireInteger; created: WireInteger; updated: WireInteger }
export interface Rating { average: number; count: number; mine: number }
export interface Work { id: string; title: string; description: string; author: PublicAuthor; design: Design; provenance: unknown; parentId: string | null; schemeId: string | null; created: WireInteger; rating: Rating }
export interface ApiFailure extends Error { code: string; params: Record<string, unknown>; status: number }
export type MessageScalar = string | number | bigint | boolean | null | undefined | LocalizedMessage;
export type MessageParameters = Record<string, MessageScalar | (() => MessageScalar)>;
export interface LocalizedMessage { toString(): string }
export type Notification = string | LocalizedMessage | (() => string | LocalizedMessage);
export type Toast = (value:Notification,undo?:()=>void|Promise<void>)=>void;
