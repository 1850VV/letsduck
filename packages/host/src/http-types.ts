import type { ExportManager } from '@letsduck/exporter';
import type { PersonalStore } from '@letsduck/storage';
import type { FastifyInstance } from 'fastify';
export type PersonalHttpServer = FastifyInstance & { waitRequests(): Promise<void> };

type Awaitable<T> = T | Promise<T>;
/** Only the HTTP-facing surface is required; hardware ownership stays in the application. */
export interface HttpServoSetup {
  snapshot(): Awaitable<unknown>;
  inspect(): Awaitable<unknown>;
  start(target?: unknown): Awaitable<unknown>;
  pause(): Awaitable<unknown>;
  halt(): Awaitable<unknown>;
  refresh(): Awaitable<unknown>;
  audit(id: unknown): Awaitable<unknown>;
  repair(id: unknown): Awaitable<unknown>;
  queue(id: unknown): Awaitable<unknown>;
}
export interface HttpDuckDebug {
  invalidateReadbacks(): void;
  numbering(): Awaitable<{ ready: boolean }>;
  status(): Awaitable<unknown>;
  action(body: Record<string, unknown>): Awaitable<unknown>;
}
export interface HostExporter {
  readonly available: boolean;
  readonly catalog: unknown;
  readonly sourceSha256: string | null;
  run: ExportManager['run'];
}
export interface AssemblyManifest {
  files: Readonly<Record<string, unknown>>;
  optionalFiles?: Readonly<Record<string, unknown>>;
}
export interface PersonalHttpOptions {
  assets: string;
  frontend: string;
  store: Pick<PersonalStore, 'schemes' | 'saveScheme' | 'deleteScheme' | 'servoRecords' | 'servoPreparationRecords' | 'saveServoPreparation'>;
  setup: HttpServoSetup;
  debug: HttpDuckDebug;
  exporter: HostExporter | null;
  /** Fixed desktop origin, or a trusted origin supplied by the application configuration. */
  uiOrigin?: string;
  /** Configured listener host. The actual bound port always comes from the socket. */
  listenHost?: string;
  assemblyManifest?: AssemblyManifest;
}
