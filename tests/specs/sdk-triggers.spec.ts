import { test, expect } from '@playwright/test';
// @ts-ignore - plain JS helper modules
const { createAuthToken, createGroup, deleteGroup, sendTextMessage } = require('../helpers/cometchatApi');
// @ts-ignore
const { resetEvents, expectWebhookEvent } = require('../helpers/webhookClient');
// @ts-ignore
const { launchSdkClient } = require('../helpers/sdkClient');

// Triggers that only fire from a real, connected SDK client (WebSocket) —
// group self-join/leave, delivery/read receipts, and connection status —
// none of which the REST API this project otherwise uses can reach. See
// tests/helpers/sdkClient.js for why, and the (now historical) skip reasons
// this file replaces in git history.
//
// group_member_joined/left specifically need a generous timeout: verified
// live these can take up to ~25-30s to deliver, well past the 10s default
// used elsewhere in this suite — delivery/read receipts and connection
// status arrive much faster but are given headroom too since they share
// the same real-time pipeline.
const GROUP_MEMBERSHIP_TIMEOUT_MS = 35000;
const RECEIPT_TIMEOUT_MS = 20000;

test.describe('Triggers reachable only via a live SDK client', () => {
  test('group_member_joined webhook fires when a user joins a public group themselves', async () => {
    const guid = `qa-sdk-join-${Date.now().toString(36)}`;
    await createGroup({ guid, name: 'SDK Join Test Group', type: 'public', onBehalfOf: 'qa-user-1' });

    const { authToken } = await createAuthToken('qa-user-2');
    const client = await launchSdkClient('qa-user-2', authToken);
    try {
      await resetEvents();
      const { hasJoined } = await client.joinGroup(guid);
      expect(hasJoined).toBe(true);

      const payload = await expectWebhookEvent(
        'group_member_joined',
        (p: any) => p?.data?.group?.guid === guid,
        GROUP_MEMBERSHIP_TIMEOUT_MS
      );

      expect(payload.data.group.guid).toBe(guid);
      expect(payload.data.group.owner).toBe('qa-user-1');
      expect(payload.data.members).toHaveProperty('qa-user-2');
      expect(payload.data.members['qa-user-2'].uid).toBe('qa-user-2');
    } finally {
      await client.close();
      await deleteGroup(guid, 'qa-user-1').catch(() => {});
    }
  });

  test('group_member_left webhook fires when a user leaves a group themselves', async () => {
    const guid = `qa-sdk-leave-${Date.now().toString(36)}`;
    await createGroup({ guid, name: 'SDK Leave Test Group', type: 'public', onBehalfOf: 'qa-user-1' });

    const { authToken } = await createAuthToken('qa-user-2');
    const client = await launchSdkClient('qa-user-2', authToken);
    try {
      await client.joinGroup(guid);
      await resetEvents();

      const { hasLeft } = await client.leaveGroup(guid);
      expect(hasLeft).toBe(true);

      const payload = await expectWebhookEvent(
        'group_member_left',
        (p: any) => p?.data?.group?.guid === guid,
        GROUP_MEMBERSHIP_TIMEOUT_MS
      );

      expect(payload.data.group.guid).toBe(guid);
      expect(payload.data.members).toHaveProperty('qa-user-2');
      expect(payload.data.members['qa-user-2'].uid).toBe('qa-user-2');
    } finally {
      await client.close();
      await deleteGroup(guid, 'qa-user-1').catch(() => {});
    }
  });

  test('message_delivery_receipt webhook fires when a recipient client acknowledges delivery', async () => {
    const message = await sendTextMessage({
      sender: 'qa-user-1',
      receiver: 'qa-user-2',
      text: `delivery-receipt-check ${Date.now().toString(36)}`,
    });

    const { authToken } = await createAuthToken('qa-user-2');
    const client = await launchSdkClient('qa-user-2', authToken);
    try {
      await resetEvents();
      await client.markAsDelivered(message.id, 'qa-user-1', 'user', 'qa-user-1');

      const payload = await expectWebhookEvent(
        'message_delivery_receipt',
        (p: any) => p?.data?.body?.messageId === String(message.id),
        RECEIPT_TIMEOUT_MS
      );

      expect(payload.data.body.action).toBe('delivered');
      expect(payload.data.body.messageId).toBe(String(message.id));
      expect(payload.data.body.user.uid).toBe('qa-user-2');
      expect(payload.data.sender).toBe('qa-user-2');
      expect(payload.data.messageSender).toBe('qa-user-1');
    } finally {
      await client.close();
    }
  });

  test('message_read_receipt webhook fires when a recipient client marks a message read', async () => {
    const message = await sendTextMessage({
      sender: 'qa-user-1',
      receiver: 'qa-user-2',
      text: `read-receipt-check ${Date.now().toString(36)}`,
    });

    const { authToken } = await createAuthToken('qa-user-2');
    const client = await launchSdkClient('qa-user-2', authToken);
    try {
      await resetEvents();
      await client.markAsRead(message.id, 'qa-user-1', 'user', 'qa-user-1');

      const payload = await expectWebhookEvent(
        'message_read_receipt',
        (p: any) => p?.data?.body?.messageId === String(message.id),
        RECEIPT_TIMEOUT_MS
      );

      expect(payload.data.body.action).toBe('read');
      expect(payload.data.body.messageId).toBe(String(message.id));
      expect(payload.data.body.user.uid).toBe('qa-user-2');
      expect(payload.data.sender).toBe('qa-user-2');
      expect(payload.data.messageSender).toBe('qa-user-1');
    } finally {
      await client.close();
    }
  });

  test('user_connection_status_changed webhook fires when a client disconnects', async () => {
    const { authToken } = await createAuthToken('qa-user-2');
    const client = await launchSdkClient('qa-user-2', authToken);

    await resetEvents();
    await client.disconnect();

    // Matched on uid + "disconnected" specifically — this trigger fires
    // ambiently for any client connecting to the app (verified live: an
    // unrelated "Guest User"/uikit session showed up in the same window),
    // so a loose matcher would give a false positive from unrelated traffic.
    const payload = await expectWebhookEvent(
      'user_connection_status_changed',
      (p: any) => p?.data?.user?.uid === 'qa-user-2' && p?.data?.currentConnection?.action === 'disconnected',
      RECEIPT_TIMEOUT_MS
    );

    expect(payload.data.status).toBe('offline');
    expect(payload.data.user.uid).toBe('qa-user-2');
    expect(payload.data.currentConnection.action).toBe('disconnected');

    await client.close();
  });
});
