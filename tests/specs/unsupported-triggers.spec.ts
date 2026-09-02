import { test } from '@playwright/test';

// These triggers are real, in-scope CometChat webhook events, but cannot be
// exercised by this REST-only test harness — they only fire from a live,
// connected SDK client (WebSocket session), not from any documented REST
// endpoint. Recorded as explicit skips (not silently omitted) so the gap is
// visible in every execution report, per the project's rule to never hide
// missing coverage.
//
// test.skip() is called *inside* each test body — the declarative
// test.skip(title, fn, reason) form silently drops the reason string in the
// JSON reporter output (see webhook-configuration.spec.ts for the same fix).

const JOIN_LEAVE_REASON =
  'Blocked: group_member_joined/left fire only from the SDK client-side joinGroup()/leaveGroup() calls over a live WebSocket session. ' +
  "Verified live (2026-09-01): calling the REST 'Add Members' endpoint with onBehalfOf set to the joining user's own UID (before " +
  'they are a member) is rejected with 401 ERR_GROUP_NOT_JOINED — CometChat requires the onBehalfOf actor to already hold ' +
  "admin/moderator scope in the group. The official REST Group Members API (docs: /rest-api/group-members) exposes only " +
  'List/Add/Change-Scope/Kick — no self-join or self-leave endpoint exists. Reproducing this trigger would require embedding the ' +
  'CometChat JS SDK in a real connected client (e.g. a headless-browser session), which is out of scope for this REST-driven suite.';

const RECEIPT_REASON =
  'Blocked: message_delivery_receipt/read_receipt fire only when a connected SDK client acknowledges receiving/reading a message ' +
  'over a live WebSocket session. Verified against the official REST Messages API reference (docs: /rest-api/messages) — its full ' +
  '"Available operations" table (Send/List/Get/Update/Delete/Thread/Reactions) has no mark-as-delivered or mark-as-read endpoint. ' +
  'Reproducing this trigger would require a real connected SDK client, which is out of scope for this REST-driven suite.';

const CONNECTION_REASON =
  'Blocked: user_connection_status_changed fires when a client connects/disconnects from the WebSocket server. The REST API can ' +
  'create an auth token (Create Auth Token) but that alone does not open a live connection — only an SDK client actually connecting ' +
  'over WebSocket triggers this event. It has been observed arriving incidentally (111 captures in the persisted event history) as a ' +
  'side effect of other tooling connecting to the app, but this suite has no deterministic, repeatable way to trigger it via REST.';

test.describe('Triggers not reachable via REST API (SDK/WebSocket-only)', () => {
  test('group_member_joined fires when a user joins a public group themselves', () => {
    test.skip(true, JOIN_LEAVE_REASON);
  });

  test('group_member_left fires when a user leaves a group themselves', () => {
    test.skip(true, JOIN_LEAVE_REASON);
  });

  test('message_delivery_receipt fires when a recipient client acknowledges delivery', () => {
    test.skip(true, RECEIPT_REASON);
  });

  test('message_read_receipt fires when a recipient client marks a message read', () => {
    test.skip(true, RECEIPT_REASON);
  });

  test('user_connection_status_changed fires deterministically for a specific, controlled connect/disconnect', () => {
    test.skip(true, CONNECTION_REASON);
  });
});
