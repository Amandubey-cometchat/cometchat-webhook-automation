import { WebhookRegistryEntry } from './webhook.registry';

const REASON =
  'Same situation as Calls (see calls.registry.ts): no Calls & Meeting SDK integration exists in this ' +
  'project, and the add-on\'s availability on any target app is unconfirmed.';

const MEETING_IDS = ['meeting_started', 'meeting_participant_joined', 'meeting_participant_left', 'meeting_ended', 'recording_generated'];

export const MEETINGS_REGISTRY: WebhookRegistryEntry[] = MEETING_IDS.map((id) => ({
  id,
  category: 'MEETINGS',
  environments: [],
  trigger: 'Real Meetings SDK session lifecycle action',
  expectedEvent: id,
  automationMethod: 'NONE',
  expectedPayloadKeys: [],
  status: 'BLOCKED',
  specFile: 'src/tests/meetings/meetings.spec.ts',
  testTitleMatch: `${id} (documented gap)`,
  reason: REASON,
}));
