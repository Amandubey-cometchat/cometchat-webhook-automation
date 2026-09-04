/**
 * No moderation_engine_blocked/approved/manual_approved webhook has ever
 * actually been captured by this project (see
 * src/registry/moderation.registry.ts) — writing assertions against an
 * assumed payload shape would violate "do not assume fields, use the actual
 * payload structure." Once the Moderation trigger category is confirmed
 * enabled in the Dashboard and a real payload is captured, add validators
 * here following the same pattern as group.validator.ts/message.validator.ts
 * (validateEnvelope + field-by-field expect() calls against the real shape).
 */
export const MODERATION_VALIDATORS_PENDING_REAL_PAYLOAD = true;
