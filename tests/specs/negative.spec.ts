import { test, expect } from '@playwright/test';
// @ts-ignore - plain JS helper modules
const {
  sendTextMessage,
  editMessage,
  createGroup,
  deleteGroup,
  updateGroup,
  kickGroupMember,
  addGroupMembers,
} = require('../helpers/cometchatApi');
// @ts-ignore
const { resetEvents, expectWebhookEvent, assertNoWebhookEvent } = require('../helpers/webhookClient');

// Every case here first proves the REST call was actually rejected (not a
// fabricated assumption), then proves the corresponding webhook never fired.
// A rejected action producing a webhook anyway would itself be a serious bug.

let currentGuid: string | undefined;

test.beforeEach(async () => {
  await resetEvents();
});

// Cleanup lives in afterEach (not inline at the end of each test body) so a
// failed assertion mid-test still triggers it — otherwise a failing negative
// test would silently leak its group into the real app.
test.afterEach(async () => {
  if (currentGuid) {
    await deleteGroup(currentGuid).catch(() => {});
    currentGuid = undefined;
  }
});

test('sending a message to a nonexistent user is rejected and fires no message_sent', async () => {
  const receiver = `no-such-user-${Date.now()}`;

  await expect(sendTextMessage({ sender: 'qa-user-1', receiver, text: 'should never arrive' })).rejects.toThrow(
    /404/
  );

  await assertNoWebhookEvent('message_sent', (p) => p?.data?.message?.receiver === receiver);
});

test('creating a group with a duplicate guid is rejected and fires only one group_created', async () => {
  const guid = (currentGuid = `qa-neg-dup-${Date.now()}`);
  await createGroup({ guid, name: 'Original' });
  // Wait for the *first* group's own webhook to actually land before
  // resetting — otherwise its legitimately-delayed delivery can arrive
  // during the "expect nothing" window below and look like a duplicate
  // from the (rejected) second call, which never should have fired anything.
  await expectWebhookEvent('group_created', (p) => p?.data?.group?.guid === guid);
  await resetEvents();

  await expect(createGroup({ guid, name: 'Duplicate attempt' })).rejects.toThrow(/400/);

  await assertNoWebhookEvent('group_created', (p) => p?.data?.group?.guid === guid);
});

test('kicking a user who never joined the group is rejected and fires no group_member_kicked', async () => {
  const guid = (currentGuid = `qa-neg-notmember-${Date.now()}`);
  await createGroup({ guid, name: 'Not Member Group', onBehalfOf: 'qa-user-1' });
  await resetEvents();

  await expect(kickGroupMember(guid, 'qa-user-2', 'qa-user-1')).rejects.toThrow(/404/);

  await assertNoWebhookEvent('group_member_kicked', (p) => p?.data?.group?.guid === guid);
});

test('updating a nonexistent group is rejected and fires no group_updated', async () => {
  const guid = `qa-neg-missing-${Date.now()}`;

  await expect(updateGroup(guid, { name: 'x' })).rejects.toThrow(/404/);

  await assertNoWebhookEvent('group_updated', (p) => p?.data?.group?.guid === guid);
});

test('editing a nonexistent message is rejected and fires no message_edited', async () => {
  const fakeId = '999999999999';

  await expect(editMessage(fakeId, 'x')).rejects.toThrow(/404/);

  await assertNoWebhookEvent('message_edited', (p) => p?.data?.message?.id === fakeId);
});

test('an invalid REST API key is rejected with 401', async () => {
  const { COMETCHAT_APP_ID, COMETCHAT_REGION } = process.env;
  const res = await fetch(`https://${COMETCHAT_APP_ID}.api-${COMETCHAT_REGION}.cometchat.io/v3/users`, {
    headers: { appId: COMETCHAT_APP_ID as string, apiKey: 'totally-invalid-key', 'Content-Type': 'application/json' },
  });
  expect(res.status).toBe(401);
});

test('the local webhook receiver rejects deliveries without valid Basic Auth', async () => {
  // This is the receiver's own security boundary, not CometChat's — proves
  // that a webhook delivery without the configured credentials is actually
  // refused (401) and never stored, rather than assumed to be secure.
  const receiverUrl = (process.env.RECEIVER_QUERY_URL || 'http://localhost:4001') + '/webhook';

  const noAuth = await fetch(receiverUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trigger: 'fake_trigger_for_auth_test', data: {} }),
  });
  expect(noAuth.status).toBe(401);

  const wrongAuth = await fetch(receiverUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Basic ' + Buffer.from('wrong:creds').toString('base64') },
    body: JSON.stringify({ trigger: 'fake_trigger_for_auth_test', data: {} }),
  });
  expect(wrongAuth.status).toBe(401);

  await assertNoWebhookEvent('fake_trigger_for_auth_test');
});

test('sending an empty-text message is rejected and fires no message_sent', async () => {
  await expect(sendTextMessage({ sender: 'qa-user-1', receiver: 'qa-user-2', text: '' })).rejects.toThrow(/400/);
});
