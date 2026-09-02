import { test, expect } from '@playwright/test';
// @ts-ignore - plain JS helper modules
const { sendTextMessage } = require('../helpers/cometchatApi');
// @ts-ignore
const { resetEvents, expectWebhookEvent, assertNoWebhookEvent } = require('../helpers/webhookClient');

test.beforeEach(async () => {
  await resetEvents();
});

// A single character repeated thousands of times reads as spam to
// CometChat's Moderation Engine and gets silently blocked instead of
// delivered — verified live (2026-09-02). Words in varied order still test
// "is a large payload delivered intact" without tripping that heuristic.
const FILLER_WORDS = [
  'the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog', 'while',
  'testing', 'webhook', 'payload', 'delivery', 'across', 'a', 'large',
  'message', 'body', 'to', 'confirm', 'nothing', 'gets', 'truncated', 'or',
  'corrupted', 'along', 'way', 'even', 'when', 'it', 'is', 'quite', 'long',
];
function fillerText(length) {
  let out = '';
  while (out.length < length) {
    out += FILLER_WORDS[Math.floor(Math.random() * FILLER_WORDS.length)] + ' ';
  }
  return out.slice(0, length);
}

test('unicode and emoji text round-trips byte-for-byte through the webhook', async () => {
  // .toString(36) rather than a raw number — a bare 10+ digit run in message
  // text trips CometChat's built-in Moderation Engine "Contact details
  // filter" (it pattern-matches digit runs as phone numbers), which silently
  // fires moderation_engine_blocked instead of message_sent. Verified live.
  const text = `héllo 世界 🚀🔥 مرحبا Здравствуй ${Date.now().toString(36)}`;

  const message = await sendTextMessage({ sender: 'qa-user-1', receiver: 'qa-user-2', text });

  const payload = await expectWebhookEvent('message_sent', (p) => p?.data?.message?.id === String(message.id));

  expect(payload.data.message.data.text).toBe(text);
});

test('special/HTML-like characters are preserved exactly, not escaped or stripped', async () => {
  const text = `<script>alert('x')</script> "quotes" 'apos' \\backslash\\ & ampersand ${Date.now().toString(36)}`;

  const message = await sendTextMessage({ sender: 'qa-user-1', receiver: 'qa-user-2', text });

  const payload = await expectWebhookEvent('message_sent', (p) => p?.data?.message?.id === String(message.id));

  expect(payload.data.message.data.text).toBe(text);
});

test('a large but valid message (9000 chars, under the 10KB data cap) is delivered intact', async () => {
  const text = `${Date.now().toString(36)}-` + fillerText(9000);

  const message = await sendTextMessage({ sender: 'qa-user-1', receiver: 'qa-user-2', text });

  const payload = await expectWebhookEvent('message_sent', (p) => p?.data?.message?.id === String(message.id));

  expect(payload.data.message.data.text).toBe(text);
  expect(payload.data.message.data.text.length).toBe(text.length);
});

test('an oversized message (70000 chars, over the payload cap) is rejected and fires no webhook', async () => {
  const text = `${Date.now().toString(36)}-` + fillerText(70000);

  await expect(sendTextMessage({ sender: 'qa-user-1', receiver: 'qa-user-2', text })).rejects.toThrow(/400/);

  await assertNoWebhookEvent('message_sent', (p) => p?.data?.message?.data?.text === text);
});

test('rapid consecutive messages each produce their own distinct, correctly-matched webhook', async () => {
  const stamp = Date.now().toString(36);
  const texts = [`rapid-1-${stamp}`, `rapid-2-${stamp}`, `rapid-3-${stamp}`];

  // Fire all three with no delay between them — this is the scenario most
  // likely to expose lost events or id mix-ups if the receiver or the
  // matching logic has a race condition.
  const messages = await Promise.all(texts.map((text) => sendTextMessage({ sender: 'qa-user-1', receiver: 'qa-user-2', text })));

  expect(new Set(messages.map((m: any) => m.id)).size).toBe(3); // sanity: 3 distinct message ids from CometChat itself

  for (let i = 0; i < messages.length; i++) {
    const payload = await expectWebhookEvent('message_sent', (p) => p?.data?.message?.id === String(messages[i].id));
    expect(payload.data.message.data.text).toBe(texts[i]);
  }
});
