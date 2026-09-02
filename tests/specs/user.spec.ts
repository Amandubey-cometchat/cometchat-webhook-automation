import { test, expect } from '@playwright/test';
// @ts-ignore - plain JS helper modules
const { blockUser, unblockUser } = require('../helpers/cometchatApi');
// @ts-ignore
const { resetEvents, expectWebhookEvent } = require('../helpers/webhookClient');

test.beforeEach(async () => {
  await resetEvents();
});

test('user_blocked webhook fires with the correct blocker and blocked user', async () => {
  await blockUser('qa-user-1', 'qa-user-2');

  const payload = await expectWebhookEvent('user_blocked', (p) => p?.data?.by?.uid === 'qa-user-1');

  expect(payload.trigger).toBe('user_blocked');
  expect(payload.data.by.uid).toBe('qa-user-1');
  expect(payload.data.users).toHaveProperty('qa-user-2');

  await unblockUser('qa-user-1', 'qa-user-2'); // leave state clean for other tests
});

test('user_unblocked webhook fires with the correct unblocker and unblocked user', async () => {
  await blockUser('qa-user-1', 'qa-user-2');
  await resetEvents(); // isolate from the user_blocked event above

  await unblockUser('qa-user-1', 'qa-user-2');

  const payload = await expectWebhookEvent('user_unblocked', (p) => p?.data?.by?.uid === 'qa-user-1');

  expect(payload.trigger).toBe('user_unblocked');
  expect(payload.data.by.uid).toBe('qa-user-1');
  expect(payload.data.users).toHaveProperty('qa-user-2');
});