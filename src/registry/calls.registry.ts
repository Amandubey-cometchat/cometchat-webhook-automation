import { WebhookRegistryEntry } from './webhook.registry';

const REASON =
  'This project has no Calls SDK integration on any environment, and it is unconfirmed whether the Calls & ' +
  'Meeting add-on is even enabled on any of the 4 apps (staging-us, prod-us, prod-eu, prod-in). Building a ' +
  'test against a mocked/simulated call session would violate the "never fake a PASS" rule. Needs: ' +
  'confirmation the add-on is enabled on a target app, and a real Calls SDK client integration.';

const CALL_IDS = [
  'call_initiated',
  'call_started',
  'call_participant_joined',
  'call_participant_left',
  'call_ended',
  'call_unanswered',
  'call_cancelled',
  'call_busy',
  'call_rejected',
];

export const CALLS_REGISTRY: WebhookRegistryEntry[] = CALL_IDS.map((id) => ({
  id,
  category: 'CALLS',
  environments: [],
  trigger: 'Real Calls SDK session lifecycle action',
  expectedEvent: id,
  automationMethod: 'NONE',
  expectedPayloadKeys: [],
  status: 'BLOCKED',
  specFile: 'src/tests/calls/calls.spec.ts',
  testTitleMatch: `${id} (documented gap)`,
  reason: REASON,
}));
