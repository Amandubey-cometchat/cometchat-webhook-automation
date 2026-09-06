import { WebhookRegistryEntry } from './webhook.registry';
import { AppEnvName } from '../config/config.schema';

const ALL_ENVS: AppEnvName[] = ['staging-us', 'prod-us', 'prod-eu', 'prod-in'];

export const MODERATION_REGISTRY: WebhookRegistryEntry[] = [
  {
    id: 'moderation_engine_blocked',
    category: 'MODERATION',
    environments: ALL_ENVS,
    trigger: 'Send message content that should be flagged by an active moderation rule',
    expectedEvent: 'moderation_engine_blocked',
    automationMethod: 'REST',
    expectedPayloadKeys: [],
    status: 'NOT_IMPLEMENTED',
    specFile: 'src/tests/moderation/moderation.spec.ts',
    testTitleMatch: 'moderation_engine_blocked (documented gap)',
    reason:
      'Live-probed 2026-09-04 against prod-eu: a message containing a 10+ digit phone-like pattern (the exact ' +
      'pattern this project previously observed CometChat block) now sends cleanly as message_sent, not ' +
      'moderation_engine_blocked. The message metadata does show a "human-moderation" extension ran ' +
      '(metadata.@injected.extensions.human-moderation.success = true), but no moderation webhook fired at ' +
      'all. Re-probed 2026-09-05 (new prod-eu app) with profanity/violence words ("kill", "fuck") instead of a ' +
      'phone pattern: both sent cleanly as message_sent too, and this time the human-moderation extension key ' +
      "was absent from metadata entirely (only link-preview ran) — meaning it didn't even attempt to process " +
      'this content, unlike the phone-pattern case. Together this suggests specific moderation rules are ' +
      'individually toggled (same per-trigger-checkbox pattern as Group triggers) rather than one on/off switch, ' +
      'and profanity detection specifically may not be an enabled rule on this app at all. Needs a Dashboard ' +
      'check: Moderation -> which specific rules are enabled, plus whether the Moderation trigger category is ' +
      'checked in the webhook config.',
  },
  {
    id: 'moderation_engine_approved',
    category: 'MODERATION',
    environments: ALL_ENVS,
    trigger: 'Send message content that clears active moderation checks',
    expectedEvent: 'moderation_engine_approved',
    automationMethod: 'REST',
    expectedPayloadKeys: [],
    status: 'NOT_IMPLEMENTED',
    specFile: 'src/tests/moderation/moderation.spec.ts',
    testTitleMatch: 'moderation_engine_approved (documented gap)',
    reason: 'Same root cause as moderation_engine_blocked above.',
  },
  {
    id: 'moderation_manual_approved',
    category: 'MODERATION',
    environments: ALL_ENVS,
    trigger: 'A human admin manually approves flagged content in the Dashboard',
    expectedEvent: 'moderation_manual_approved',
    automationMethod: 'NONE',
    expectedPayloadKeys: [],
    status: 'BLOCKED',
    specFile: 'src/tests/moderation/moderation.spec.ts',
    testTitleMatch: 'moderation_manual_approved (documented gap)',
    reason: 'No REST or SDK equivalent exists for a human manually approving a flagged item — Dashboard-only action.',
  },
];
