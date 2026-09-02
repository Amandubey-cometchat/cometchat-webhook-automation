import { test, expect } from '@playwright/test';
// @ts-ignore - plain JS helper modules
const { sendTextMessage, editMessage, deleteMessage, addReaction, removeReaction } = require('../helpers/cometchatApi');
// @ts-ignore
const { resetEvents, expectWebhookEvent } = require('../helpers/webhookClient');

test.beforeEach(async () => {
  await resetEvents();
});

test('message_sent webhook fires when a text message is sent', async () => {
  // .toString(36) rather than a raw number — a bare 10+ digit run in message
  // text trips CometChat's built-in Moderation Engine "Contact details
  // filter" (it pattern-matches digit runs as phone numbers), which silently
  // fires moderation_engine_blocked instead of message_sent. Verified live.
  const text = `automated test message ${Date.now().toString(36)}`;

  const message = await sendTextMessage({ sender: 'qa-user-1', receiver: 'qa-user-2', receiverType: 'user', text });

  const payload = await expectWebhookEvent('message_sent', (p) => p?.data?.message?.id === String(message.id));

  // Deep validation, not just "an event arrived" — every field a consumer
  // would actually rely on downstream.
  expect(payload.trigger).toBe('message_sent');
  expect(payload.data.message.id).toBe(String(message.id));
  expect(payload.data.message.sender).toBe('qa-user-1');
  expect(payload.data.message.receiver).toBe('qa-user-2');
  expect(payload.data.message.receiverType).toBe('user');
  expect(payload.data.message.category).toBe('message');
  expect(payload.data.message.type).toBe('text');
  expect(payload.data.message.data.text).toBe(text);
  expect(payload.appId).toBe(process.env.COMETCHAT_APP_ID);
  expect(payload.region).toBe(process.env.COMETCHAT_REGION);
  expect(typeof payload.data.message.sentAt).toBe('number');
  // Delivery mechanics, via the receiver's own correlation metadata.
  expect(payload.__event.method).toBe('POST');
  // Content-Type media types are case-insensitive per RFC 7231 — CometChat
  // sends "Application/json" (capital A), which is valid, just non-canonical.
  expect(payload.__event.headers['content-type'].toLowerCase()).toContain('application/json');
});

test('message_edited webhook fires when a message is edited, with the new text', async () => {
  const original = await sendTextMessage({ sender: 'qa-user-1', receiver: 'qa-user-2', text: `edit-me ${Date.now().toString(36)}` });
  const newText = `edited ${Date.now().toString(36)}`;

  await editMessage(original.id, newText, 'qa-user-1');

  const payload = await expectWebhookEvent('message_edited', (p) => p?.data?.message?.id === String(original.id));

  expect(payload.trigger).toBe('message_edited');
  expect(payload.data.message.id).toBe(String(original.id));
  expect(payload.data.message.data.text).toBe(newText);
  // The identity change is the whole point of this trigger — confirm the
  // edited text isn't just "present somewhere" but is *the current value*.
  expect(payload.data.message.data.text).not.toBe(original.data.text);
});

test('message_deleted webhook fires when a message is deleted', async () => {
  const original = await sendTextMessage({ sender: 'qa-user-1', receiver: 'qa-user-2', text: `delete-me ${Date.now().toString(36)}` });

  await deleteMessage(original.id, 'qa-user-1');

  const payload = await expectWebhookEvent('message_deleted', (p) => p?.data?.message?.id === String(original.id));

  expect(payload.trigger).toBe('message_deleted');
  expect(payload.data.message.id).toBe(String(original.id));
});

test('message_reaction_added webhook fires with the correct emoji, message and reactor', async () => {
  const message = await sendTextMessage({ sender: 'qa-user-1', receiver: 'qa-user-2', text: `react-me ${Date.now().toString(36)}` });

  await addReaction(message.id, '👍', 'qa-user-2');

  const payload = await expectWebhookEvent(
    'message_reaction_added',
    (p) => p?.data?.reaction?.messageId === String(message.id)
  );

  expect(payload.trigger).toBe('message_reaction_added');
  expect(payload.data.reaction.messageId).toBe(String(message.id));
  expect(payload.data.reaction.reaction).toBe('👍');
  expect(payload.data.reaction.reactedBy.uid).toBe('qa-user-2');
});

test('message_reaction_removed webhook fires with the correct emoji, message and reactor', async () => {
  const message = await sendTextMessage({ sender: 'qa-user-1', receiver: 'qa-user-2', text: `unreact-me ${Date.now().toString(36)}` });
  await addReaction(message.id, '🎉', 'qa-user-2');
  await resetEvents(); // isolate from the reaction_added event above

  await removeReaction(message.id, '🎉', 'qa-user-2');

  const payload = await expectWebhookEvent(
    'message_reaction_removed',
    (p) => p?.data?.reaction?.messageId === String(message.id)
  );

  expect(payload.trigger).toBe('message_reaction_removed');
  expect(payload.data.reaction.messageId).toBe(String(message.id));
  expect(payload.data.reaction.reaction).toBe('🎉');
  expect(payload.data.reaction.reactedBy.uid).toBe('qa-user-2');
});

test('user_mentioned webhook fires when a message mentions a user, and message_sent also fires for the same message', async () => {
  const text = `Hi <@uid:qa-user-2> check this out ${Date.now().toString(36)}`;

  const message = await sendTextMessage({ sender: 'qa-user-1', receiver: 'qa-user-2', text });

  const mentionPayload = await expectWebhookEvent('user_mentioned', (p) => p?.data?.message?.id === String(message.id));
  expect(mentionPayload.trigger).toBe('user_mentioned');
  expect(mentionPayload.data.message.id).toBe(String(message.id));
  expect(mentionPayload.data.message.data.text).toBe(text);
  expect(mentionPayload.data.message.data.mentions).toHaveProperty('qa-user-2');

  // A mention doesn't replace the ordinary send event — both should fire
  // for the same message id.
  const sentPayload = await expectWebhookEvent('message_sent', (p) => p?.data?.message?.id === String(message.id));
  expect(sentPayload.data.message.id).toBe(String(message.id));
});
