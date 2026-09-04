import { WebhookRegistryEntry } from './webhook.registry';

const REASON =
  'This project has no Campaigns/Notifications module integration on any environment, and it is unconfirmed ' +
  'whether that module is even enabled on any of the 4 target apps. Needs: confirmation the module is ' +
  'enabled, and the relevant Campaign management API/UI to actually run one.';

const CAMPAIGN_IDS = [
  'after_campaign_completed',
  'after_campaign_failed',
  'after_feed_item_read',
  'after_feed_item_interacted',
  'after_feed_item_sent',
  'after_push_notification_clicked',
  'after_notification_created',
  'after_feed_item_delivered',
  'after_push_notification_sent',
  'after_push_notification_delivered',
];

export const CAMPAIGN_REGISTRY: WebhookRegistryEntry[] = CAMPAIGN_IDS.map((id) => ({
  id,
  category: 'CAMPAIGN',
  environments: [],
  trigger: 'Real Campaigns/Notifications module action',
  expectedEvent: id,
  automationMethod: 'NONE',
  expectedPayloadKeys: [],
  status: 'BLOCKED',
  specFile: 'src/tests/campaign/campaign.spec.ts',
  testTitleMatch: `${id} (documented gap)`,
  reason: REASON,
}));
