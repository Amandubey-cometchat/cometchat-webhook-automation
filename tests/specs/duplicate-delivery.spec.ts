import { test, expect } from '@playwright/test';
// @ts-ignore - plain JS helper modules
const { sendTextMessage, createGroup, deleteGroup, blockUser, unblockUser } = require('../helpers/cometchatApi');
// @ts-ignore
const { resetEvents, expectSingleWebhookEvent } = require('../helpers/webhookClient');

// These checks verify webhook *delivery* behaviour rather than payload shape:
// one action should produce exactly one webhook call, never a duplicate from
// a retried delivery. Run across a few representative triggers rather than
// all of them, since retries are a property of CometChat's delivery layer,
// not of any individual trigger's payload.

test.beforeEach(async () => {
  await resetEvents();
});

test('message_sent is not delivered more than once for a single message', async () => {
  const text = `dup-check ${Date.now().toString(36)}`;

  const message = await sendTextMessage({ sender: 'qa-user-1', receiver: 'qa-user-2', text });

  const payload = await expectSingleWebhookEvent('message_sent', (p) => p?.data?.message?.id === String(message.id));
  expect(payload.data.message.data.text).toBe(text);
});

test('group_created is not delivered more than once for a single group', async () => {
  const guid = `qa-group-dup-${Date.now()}`;

  await createGroup({ guid, name: 'Duplicate Check Group', onBehalfOf: 'qa-user-1' });

  try {
    const payload = await expectSingleWebhookEvent('group_created', (p) => p?.data?.group?.guid === guid);
    expect(payload.data.group.owner).toBe('qa-user-1');
  } finally {
    await deleteGroup(guid).catch(() => {});
  }
});

test('user_blocked is not delivered more than once for a single block action', async () => {
  await blockUser('qa-user-1', 'qa-user-2');

  try {
    const payload = await expectSingleWebhookEvent('user_blocked', (p) => p?.data?.by?.uid === 'qa-user-1');
    expect(payload.data.users).toHaveProperty('qa-user-2');
  } finally {
    await unblockUser('qa-user-1', 'qa-user-2').catch(() => {});
  }
});
