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
      'all. Most likely, based on this project\'s prior experience with Group triggers (a category can show ' +
      '"on" while individual trigger checkboxes are unchecked): the Moderation trigger category simply isn\'t ' +
      'enabled in the webhook\'s trigger configuration. Needs a Dashboard check.',
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
