import map from '../assemble/servo-map.json' with {type:'json'};

// Legacy actor keys identify geometry, not bus addresses. PDF front view:
// image left = 20–24; image right = 10–14. Persisted records stay keyed by ID.
export const SERVO_BINDINGS=map.bindings;
export const SERVO_IDS=Object.fromEntries(SERVO_BINDINGS.map(b=>[b.actorId,b.id]));
