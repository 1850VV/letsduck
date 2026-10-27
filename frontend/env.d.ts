/// <reference types="vite/client" />
// Runtime stays at the checked-in r180 build; declarations match its revision.
declare module '*vendor/three.module.js' { export * from 'three'; }
declare module '*vendor/three.core.js' { export * from 'three'; }
declare module '*vendor/OrbitControls.js' { export * from 'three/examples/jsm/controls/OrbitControls.js'; }
declare module '*vendor/GLTFLoader.js' { export * from 'three/examples/jsm/loaders/GLTFLoader.js'; }
declare module '*vendor/RoomEnvironment.js' { export * from 'three/examples/jsm/environments/RoomEnvironment.js'; }
declare module '*vendor/BufferGeometryUtils.js' { export * from 'three/examples/jsm/utils/BufferGeometryUtils.js'; }
declare module '*vendor/meshopt_decoder.mjs' { export { MeshoptDecoder } from 'meshoptimizer'; }
declare module '*vendor/qrcodegen.mjs' {
  interface ErrorCorrection { readonly ordinal: number; readonly formatBits: number }
  interface Matrix { readonly size: number; getModule(x: number, y: number): boolean }
  export const qrcodegen: { QrCode: {
    encodeText(text: string, correction: ErrorCorrection): Matrix;
    readonly Ecc: { readonly LOW: ErrorCorrection; readonly MEDIUM: ErrorCorrection; readonly QUARTILE: ErrorCorrection; readonly HIGH: ErrorCorrection };
  } };
}
