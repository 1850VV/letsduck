import type { ServerStore, ServerUser } from '@letsduck/storage';
export const UNHANDLED = Symbol('unhandled server route');
export interface ServerApiContext {
  readonly method: string;
  readonly path: string;
  readonly store: ServerStore;
  token(): string | null;
  query(name: string, fallback?: string): string | undefined;
  optionalUser(): Promise<ServerUser | null>;
  requireUser(): Promise<ServerUser>;
  readJson(): Promise<Record<string, unknown>>;
  validId(value: string): string;
}
export class ServerHttpError extends Error {
  constructor(readonly status: number, readonly body: Record<string, unknown> | Buffer, readonly headers: Record<string, string> = {}, readonly contentType = 'application/json') { super(Buffer.isBuffer(body) ? body.toString() : String(body.code ?? body.error)); }
}
export const serverNotFound = { error: '未知接口', code: 'request.not_found', params: {} };
export function serverFail(status: number, error: string, code: string, headers: Record<string, string> = {}): never {
  throw new ServerHttpError(status, { error, code, params: {} }, headers);
}
