import { test, expect } from '@playwright/test';
// @ts-ignore - plain JS helper modules
const { createAuthToken, createGroup, addGroupMembers, deleteGroup, sendTextMessage } = require('../helpers/cometchatApi');
// @ts-ignore
const { resetEvents, expectWebhookEvent } = require('../helpers/webhookClient');
// @ts-ignore
const { launchSdkClient } = require('../helpers/sdkClient');

// message_delivered_to_all / message_read_by_all are aggregate group events,
// distinct from the per-recipient message_delivery_receipt/message_read_receipt
// covered in sdk-triggers.spec.ts. Verified live 2026-09-04: sending the same
// markAsDelivered/markAsRead calls in a 1:1 conversation fires ONLY the
// per-recipient receipt — these two aggregate triggers never fire outside a
// group, where they mean "every member has now acknowledged this message".
const RECEIPT_TIMEOUT_MS = 20000;

test('message_delivered_to_all webhook fires once every group member has received the message', async () => {
  const guid = `qa-agg-delivered-${Date.now().toString(36)}`;
  await createGroup({ guid, name: 'Aggregate Delivery Test Group', type: 'public', onBehalfOf: 'qa-user-1' });
  await addGroupMembers(guid, { participants: ['qa-user-2'], onBehalfOf: 'qa-user-1' });

  const message = await sendTextMessage({
    sender: 'qa-user-1',
    receiver: guid,
    receiverType: 'group',
    text: `agg-delivered-check ${Date.now().toString(36)}`,
  });

  const { authToken } = await createAuthToken('qa-user-2');
  const client = await launchSdkClient('qa-user-2', authToken);
  try {
    await resetEvents();
    await client.markAsDelivered(message.id, guid, 'group', 'qa-user-1');

    const payload = await expectWebhookEvent(
      'message_delivered_to_all',
      (p: any) => p?.data?.body?.messageId === String(message.id),
      RECEIPT_TIMEOUT_MS
    );

    expect(payload.data.receiver).toBe(guid);
    expect(payload.data.receiverType).toBe('group');
    expect(payload.data.messageSender).toBe('qa-user-1');
    expect(payload.data.body.action).toBe('deliveredToAll');
    expect(payload.data.body.messageId).toBe(String(message.id));
  } finally {
    await client.close();
    await deleteGroup(guid, 'qa-user-1').catch(() => {});
  }
});

test('message_read_by_all webhook fires once every group member has read the message', async () => {
  const guid = `qa-agg-read-${Date.now().toString(36)}`;
  await createGroup({ guid, name: 'Aggregate Read Test Group', type: 'public', onBehalfOf: 'qa-user-1' });
  await addGroupMembers(guid, { participants: ['qa-user-2'], onBehalfOf: 'qa-user-1' });

  const message = await sendTextMessage({
    sender: 'qa-user-1',
    receiver: guid,
    receiverType: 'group',
    text: `agg-read-check ${Date.now().toString(36)}`,
  });

  const { authToken } = await createAuthToken('qa-user-2');
  const client = await launchSdkClient('qa-user-2', authToken);
  try {
    await resetEvents();
    // readByAll implies deliveredToAll — mark delivered first, same as a real client would.
    await client.markAsDelivered(message.id, guid, 'group', 'qa-user-1');
    await client.markAsRead(message.id, guid, 'group', 'qa-user-1');

    const payload = await expectWebhookEvent(
      'message_read_by_all',
      (p: any) => p?.data?.body?.messageId === String(message.id),
      RECEIPT_TIMEOUT_MS
    );

    expect(payload.data.receiver).toBe(guid);
    expect(payload.data.receiverType).toBe('group');
    expect(payload.data.messageSender).toBe('qa-user-1');
    expect(payload.data.body.action).toBe('readByAll');
    expect(payload.data.body.messageId).toBe(String(message.id));
  } finally {
    await client.close();
    await deleteGroup(guid, 'qa-user-1').catch(() => {});
  }
});
