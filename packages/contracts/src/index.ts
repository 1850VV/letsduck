/** Existing wire shapes. Runtime validation is added with the shared rules. */
export interface ApiError {
  error: string;
  code: string;
  params: Record<string, unknown>;
}

export type SiteConfig =
  | { publicUrl: string; edition: 'personal'; assembly: boolean; servoSetup: boolean; servoPreparation: boolean }
  | { publicUrl: string; edition: 'server' };
