export class SetupError extends Error {}
export class Offline extends SetupError {}
export class Cancelled extends SetupError {}

export class DebugError extends Error {
  constructor(message: string, readonly details: Record<string, unknown> = {}) { super(message); }
}
