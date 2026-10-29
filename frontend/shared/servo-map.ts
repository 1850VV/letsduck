import {SERVO_BINDINGS as bindings} from '@letsduck/contracts';
import type {ServoBinding} from '../assemble/servo-types.js';

// Legacy actor keys identify geometry, not bus addresses. PDF front view:
// image left = 20–24; image right = 10–14. Persisted records stay keyed by ID.
export const SERVO_BINDINGS:readonly ServoBinding[]=bindings;
export {SERVO_IDS} from '@letsduck/contracts';
