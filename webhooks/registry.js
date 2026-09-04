/**
 * Central, single-source-of-truth inventory of every CometChat webhook this
 * project is responsible for covering. Nothing about coverage status should
 * be tracked anywhere else — the coverage report (scripts/generate-coverage-report.js),
 * the README's numbers, and the receiver dashboard all derive from this file
 * so it's impossible for the "real" list and a stale doc/comment to drift apart.
 *
 * Status values:
 *   AUTOMATED       - a real test exists, exercises the real trigger, and asserts on the real payload
 *   NOT_IMPLEMENTED - achievable in principle with what this project already has, but no test written yet
 *   BLOCKED         - cannot be triggered at all with what's currently available (missing module/credentials/
 *                     product surface, or requires a manual human action with no API equivalent)
 *
 * specFile/testTitleMatch let the coverage report correlate a registry entry with a real
 * Playwright JSON-reporter result (see scripts/generate-coverage-report.js) — testTitleMatch
 * is matched as a substring against that spec's title within specFile.
 */

const GROUP = [
  {
    id: 'group_created',
    trigger: 'Create group',
    expectedEvent: 'group_created',
    automationMethod: 'REST',
    expectedPayloadKeys: ['data.group.guid', 'data.group.name', 'data.group.type', 'data.group.owner'],
    status: 'AUTOMATED',
    specFile: 'tests/specs/group.spec.ts',
    testTitleMatch: 'group_created webhook fires with correct guid, name, type and owner',
  },
  {
    id: 'group_updated',
    trigger: 'Update group name',
    expectedEvent: 'group_updated',
    automationMethod: 'REST',
    expectedPayloadKeys: ['data.group.guid', 'data.group.name'],
    status: 'AUTOMATED',
    specFile: 'tests/specs/group.spec.ts',
    testTitleMatch: 'group_updated webhook fires with the new name applied',
  },
  {
    id: 'group_deleted',
    trigger: 'Delete group',
    expectedEvent: 'group_deleted',
    automationMethod: 'REST',
    expectedPayloadKeys: ['data.group.guid'],
    status: 'AUTOMATED',
    specFile: 'tests/specs/group.spec.ts',
    testTitleMatch: 'group_deleted webhook fires for the deleted guid',
  },
  {
    id: 'group_member_added',
    trigger: 'Add member to group (REST, on behalf of owner)',
    expectedEvent: 'group_member_added',
    automationMethod: 'REST',
    expectedPayloadKeys: ['data.group.guid', 'data.members', 'data.addedBy'],
    status: 'AUTOMATED',
    specFile: 'tests/specs/group.spec.ts',
    testTitleMatch: 'group_member_added webhook fires with correct member and actor',
  },
  {
    id: 'group_member_kicked',
    trigger: 'Remove group member',
    expectedEvent: 'group_member_kicked',
    automationMethod: 'REST',
    expectedPayloadKeys: ['data.group.guid', 'data.members'],
    status: 'AUTOMATED',
    specFile: 'tests/specs/group.spec.ts',
    testTitleMatch: 'group_member_kicked webhook fires with correct member and actor',
  },
  {
    id: 'group_member_banned',
    trigger: 'Ban group member',
    expectedEvent: 'group_member_banned',
    automationMethod: 'REST',
    expectedPayloadKeys: ['data.group.guid', 'data.members'],
    status: 'AUTOMATED',
    specFile: 'tests/specs/group.spec.ts',
    testTitleMatch: 'group_member_banned webhook fires with correct member and actor',
  },
  {
    id: 'group_member_unbanned',
    trigger: 'Unban group member',
    expectedEvent: 'group_member_unbanned',
    automationMethod: 'REST',
    expectedPayloadKeys: ['data.group.guid', 'data.members'],
    status: 'AUTOMATED',
    specFile: 'tests/specs/group.spec.ts',
    testTitleMatch: 'group_member_unbanned webhook fires with correct member and actor',
  },
  {
    id: 'group_member_scope_changed',
    trigger: "Change a member's scope",
    expectedEvent: 'group_member_scope_changed',
    automationMethod: 'REST',
    expectedPayloadKeys: ['data.group.guid', 'data.members'],
    status: 'AUTOMATED',
    specFile: 'tests/specs/group.spec.ts',
    testTitleMatch: 'group_member_scope_changed webhook fires with old and new scope',
  },
  {
    id: 'group_owner_transferred',
    trigger: 'Transfer group ownership',
    expectedEvent: 'group_owner_transferred',
    automationMethod: 'REST',
    expectedPayloadKeys: ['data.group.guid', 'data.group.owner'],
    status: 'AUTOMATED',
    specFile: 'tests/specs/group.spec.ts',
    testTitleMatch: 'group_owner_transferred webhook fires with correct old and new owner',
  },
  {
    id: 'group_member_joined',
    trigger: 'A real SDK client self-joins a public group (no REST equivalent — verified live)',
    expectedEvent: 'group_member_joined',
    automationMethod: 'SDK',
    expectedPayloadKeys: ['data.group.guid', 'data.group.owner', 'data.members'],
    status: 'AUTOMATED',
    specFile: 'tests/specs/sdk-triggers.spec.ts',
    testTitleMatch: 'group_member_joined webhook fires when a user joins a public group themselves',
  },
  {
    id: 'group_member_left',
    trigger: 'A real SDK client self-leaves a group (no REST equivalent — verified live)',
    expectedEvent: 'group_member_left',
    automationMethod: 'SDK',
    expectedPayloadKeys: ['data.group.guid', 'data.members'],
    status: 'AUTOMATED',
    specFile: 'tests/specs/sdk-triggers.spec.ts',
    testTitleMatch: 'group_member_left webhook fires when a user leaves a group themselves',
  },
];

const MESSAGE = [
  {
    id: 'message_sent',
    trigger: 'Send a text message',
    expectedEvent: 'message_sent',
    automationMethod: 'REST',
    expectedPayloadKeys: ['data.message.id', 'data.message.sender', 'data.message.receiver', 'data.message.data.text'],
    status: 'AUTOMATED',
    specFile: 'tests/specs/message.spec.ts',
    testTitleMatch: 'message_sent webhook fires when a text message is sent',
  },
  {
    id: 'message_edited',
    trigger: 'Edit an existing message',
    expectedEvent: 'message_edited',
    automationMethod: 'REST',
    expectedPayloadKeys: ['data.message.id', 'data.message.data.text'],
    status: 'AUTOMATED',
    specFile: 'tests/specs/message.spec.ts',
    testTitleMatch: 'message_edited webhook fires when a message is edited, with the new text',
  },
  {
    id: 'message_deleted',
    trigger: 'Delete a message',
    expectedEvent: 'message_deleted',
    automationMethod: 'REST',
    expectedPayloadKeys: ['data.message.id'],
    status: 'AUTOMATED',
    specFile: 'tests/specs/message.spec.ts',
    testTitleMatch: 'message_deleted webhook fires when a message is deleted',
  },
  {
    id: 'message_reaction_added',
    trigger: 'Add a reaction to a message',
    expectedEvent: 'message_reaction_added',
    automationMethod: 'REST',
    expectedPayloadKeys: ['data.reaction.messageId', 'data.reaction.reaction', 'data.reaction.reactedBy'],
    status: 'AUTOMATED',
    specFile: 'tests/specs/message.spec.ts',
    testTitleMatch: 'message_reaction_added webhook fires with the correct emoji, message and reactor',
  },
  {
    id: 'message_reaction_removed',
    trigger: 'Remove a reaction from a message',
    expectedEvent: 'message_reaction_removed',
    automationMethod: 'REST',
    expectedPayloadKeys: ['data.reaction.messageId', 'data.reaction.reaction', 'data.reaction.reactedBy'],
    status: 'AUTOMATED',
    specFile: 'tests/specs/message.spec.ts',
    testTitleMatch: 'message_reaction_removed webhook fires with the correct emoji, message and reactor',
  },
  {
    id: 'user_mentioned',
    trigger: 'Send a message containing <@uid:...>',
    expectedEvent: 'user_mentioned',
    automationMethod: 'REST',
    expectedPayloadKeys: ['data.message.id', 'data.message.data.mentions'],
    status: 'AUTOMATED',
    specFile: 'tests/specs/message.spec.ts',
    testTitleMatch: 'user_mentioned webhook fires when a message mentions a user',
  },
  {
    id: 'message_delivery_receipt',
    trigger: 'A real SDK client calls markAsDelivered (no REST equivalent — verified live)',
    expectedEvent: 'message_delivery_receipt',
    automationMethod: 'SDK',
    expectedPayloadKeys: ['data.body.action', 'data.body.messageId', 'data.body.user.uid', 'data.sender', 'data.messageSender'],
    status: 'AUTOMATED',
    specFile: 'tests/specs/sdk-triggers.spec.ts',
    testTitleMatch: 'message_delivery_receipt webhook fires when a recipient client acknowledges delivery',
  },
  {
    id: 'message_read_receipt',
    trigger: 'A real SDK client calls markAsRead (no REST equivalent — verified live)',
    expectedEvent: 'message_read_receipt',
    automationMethod: 'SDK',
    expectedPayloadKeys: ['data.body.action', 'data.body.messageId', 'data.body.user.uid', 'data.sender', 'data.messageSender'],
    status: 'AUTOMATED',
    specFile: 'tests/specs/sdk-triggers.spec.ts',
    testTitleMatch: 'message_read_receipt webhook fires when a recipient client marks a message read',
  },
  {
    id: 'message_delivered_to_all',
    trigger: 'Group message, sole other member marks it delivered — aggregate fires once every recipient has (verified live: does NOT fire for 1:1, only group)',
    expectedEvent: 'message_delivered_to_all',
    automationMethod: 'SDK',
    expectedPayloadKeys: ['data.body.action', 'data.body.messageId', 'data.sender'],
    status: 'AUTOMATED',
    specFile: 'tests/specs/aggregate-receipts.spec.ts',
    testTitleMatch: 'message_delivered_to_all webhook fires once every group member has received the message',
  },
  {
    id: 'message_read_by_all',
    trigger: 'Group message, sole other member marks it read — aggregate fires once every recipient has (verified live: does NOT fire for 1:1, only group)',
    expectedEvent: 'message_read_by_all',
    automationMethod: 'SDK',
    expectedPayloadKeys: ['data.body.action', 'data.body.messageId', 'data.sender'],
    status: 'AUTOMATED',
    specFile: 'tests/specs/aggregate-receipts.spec.ts',
    testTitleMatch: 'message_read_by_all webhook fires once every group member has read the message',
  },
];

const USER = [
  {
    id: 'user_blocked',
    trigger: 'Block a user',
    expectedEvent: 'user_blocked',
    automationMethod: 'REST',
    expectedPayloadKeys: ['data.blockedBy', 'data.blockedUser'],
    status: 'AUTOMATED',
    specFile: 'tests/specs/user.spec.ts',
    testTitleMatch: 'user_blocked webhook fires with the correct blocker and blocked user',
  },
  {
    id: 'user_unblocked',
    trigger: 'Unblock a user',
    expectedEvent: 'user_unblocked',
    automationMethod: 'REST',
    expectedPayloadKeys: ['data.unblockedBy', 'data.unblockedUser'],
    status: 'AUTOMATED',
    specFile: 'tests/specs/user.spec.ts',
    testTitleMatch: 'user_unblocked webhook fires with the correct unblocker and unblocked user',
  },
  {
    id: 'user_connection_status_changed',
    trigger: 'A real SDK client connects/disconnects (no REST equivalent)',
    expectedEvent: 'user_connection_status_changed',
    automationMethod: 'SDK',
    expectedPayloadKeys: ['data.status', 'data.user.uid', 'data.currentConnection.action'],
    status: 'AUTOMATED',
    specFile: 'tests/specs/sdk-triggers.spec.ts',
    testTitleMatch: 'user_connection_status_changed webhook fires when a client disconnects',
  },
];

const MODERATION = [
  {
    id: 'moderation_engine_blocked',
    trigger: 'Send message content that should be flagged by an active moderation rule',
    expectedEvent: 'moderation_engine_blocked',
    automationMethod: 'REST',
    expectedPayloadKeys: [],
    status: 'NOT_IMPLEMENTED',
    specFile: null,
    testTitleMatch: null,
    reason:
      'Live-probed 2026-09-04 against prod-eu: a message containing a 10+ digit phone-like ' +
      'pattern (the exact pattern this project previously observed CometChat block — see README ' +
      '"Moderation Engine" section) now sends cleanly as message_sent, not moderation_engine_blocked. ' +
      "The message's metadata does show a \"human-moderation\" extension ran (metadata.@injected." +
      'extensions.human-moderation.success = true), but no moderation_engine_blocked/approved webhook ' +
      'fired at all — most likely explanation, based on this project\'s prior experience with Group ' +
      'triggers (which had per-trigger checkboxes unchecked despite the category being "on"): the ' +
      'Moderation trigger category is present but not individually enabled in the webhook\'s trigger ' +
      'configuration. Needs Dashboard verification — see README "Known limitations".',
  },
  {
    id: 'moderation_engine_approved',
    trigger: 'Send message content that clears active moderation checks',
    expectedEvent: 'moderation_engine_approved',
    automationMethod: 'REST',
    expectedPayloadKeys: [],
    status: 'NOT_IMPLEMENTED',
    specFile: null,
    testTitleMatch: null,
    reason: 'Same root cause as moderation_engine_blocked above — see that entry.',
  },
  {
    id: 'moderation_manual_approved',
    trigger: 'A human admin manually approves flagged content in the Dashboard',
    expectedEvent: 'moderation_manual_approved',
    automationMethod: 'NONE',
    expectedPayloadKeys: [],
    status: 'BLOCKED',
    specFile: null,
    testTitleMatch: null,
    reason: 'No REST or SDK equivalent exists for a human manually approving a flagged item — this is a Dashboard-only action.',
  },
];

const CALL_MEETING = [
  'meeting_participant_joined',
  'recording_generated',
  'meeting_participant_left',
  'call_participant_left',
  'call_ended',
  'meeting_started',
  'call_unanswered',
  'call_cancelled',
  'call_initiated',
  'call_participant_joined',
  'meeting_ended',
  'call_busy',
  'call_rejected',
  'call_started',
].map((id) => ({
  id,
  trigger: 'Real Calls/Meeting SDK session lifecycle action',
  expectedEvent: id,
  automationMethod: 'NONE',
  expectedPayloadKeys: [],
  status: 'BLOCKED',
  specFile: null,
  testTitleMatch: null,
  reason:
    'This project has no Calls/Meetings SDK integration on any environment, and no confirmation the ' +
    'Calls & Meeting add-on is even enabled on prod-eu, staging-us, prod-us, or prod-in. Per explicit ' +
    'decision 2026-09-04: mark BLOCKED rather than build against a mocked/simulated call session — a ' +
    'fake trigger would violate the "never fake a PASS" rule. Needs: confirmation the add-on is enabled ' +
    'on a target app, and a Calls SDK client integration (analogous to tests/helpers/sdkClient.js).',
}));

const CAMPAIGN = [
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
].map((id) => ({
  id,
  trigger: 'Real Campaigns/Notifications module action',
  expectedEvent: id,
  automationMethod: 'NONE',
  expectedPayloadKeys: [],
  status: 'BLOCKED',
  specFile: null,
  testTitleMatch: null,
  reason:
    'This project has no Campaigns module integration on any environment, and no confirmation the ' +
    'Campaigns module is even enabled on prod-eu, staging-us, prod-us, or prod-in. Per explicit decision ' +
    '2026-09-04: mark BLOCKED rather than build against a mocked/simulated campaign. Needs: confirmation ' +
    'the module is enabled on a target app, and the relevant Campaign management API/UI to actually run one.',
}));

const CATEGORIES = {
  GROUP: GROUP.map((w) => ({ ...w, category: 'GROUP' })),
  MESSAGE: MESSAGE.map((w) => ({ ...w, category: 'MESSAGE' })),
  'CALL & MEETING': CALL_MEETING.map((w) => ({ ...w, category: 'CALL & MEETING' })),
  CAMPAIGN: CAMPAIGN.map((w) => ({ ...w, category: 'CAMPAIGN' })),
  USER: USER.map((w) => ({ ...w, category: 'USER' })),
  MODERATION: MODERATION.map((w) => ({ ...w, category: 'MODERATION' })),
};

const REGISTRY = Object.values(CATEGORIES).flat();

module.exports = { REGISTRY, CATEGORIES };
