import type { Design } from '@letsduck/contracts';
import type { ExactInteger } from './json.js';

export interface ServerUser {
  id: string;
  name: string;
  avatar: string;
  color: string;
  created: ExactInteger;
}
export interface ServerSession { token: string; user: ServerUser }
export interface ServerScheme {
  id: string;
  name: string;
  design: Design;
  provenance: unknown;
  voiceSalt: ExactInteger;
  created: ExactInteger;
  updated: ExactInteger;
}
export interface ServerWork {
  id: string;
  title: string;
  description: string;
  design: Design;
  provenance: unknown;
  parentId: string | null;
  schemeId: string | null;
  created: ExactInteger;
  author: Pick<ServerUser, 'id' | 'name' | 'avatar' | 'color'>;
  rating: { count: ExactInteger; average: number; mine: ExactInteger };
  forks: ExactInteger;
}
export interface ServerStoreOptions { database?: string; partIds?: Iterable<string> }
