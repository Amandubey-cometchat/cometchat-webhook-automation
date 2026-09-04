/**
 * Unlike calls/meetings/campaigns, Moderation doesn't need a separate SDK or
 * module — CometChat's Moderation Engine evaluates ordinary messages sent
 * through the normal Messages API. This client just sends probe content
 * shaped to exercise moderation rules, reusing messages.client.ts underneath.
 *
 * Live-reprobed 2026-09-04 against prod-eu: content that previously tripped
 * the "Contact details filter" (a 10+ digit phone-like pattern) now sends
 * cleanly as message_sent — no moderation_engine_blocked/approved webhook
 * fires either way, even though the message's own metadata shows a
 * moderation extension ran. See src/registry/moderation.registry.ts.
 */
import { sendTextMessage } from './messages.client';

export interface SendProbeMessageOptions {
  sender: string;
  receiver: string;
  receiverType?: 'user' | 'group';
}

/** Content shaped like a phone number — the pattern this project previously observed CometChat's "Contact details filter" block. */
export async function sendPhonePatternMessage({ sender, receiver, receiverType = 'user' }: SendProbeMessageOptions) {
  return sendTextMessage({
    sender,
    receiver,
    receiverType,
    text: `call me at 9876543210 please ${Date.now().toString(36)}`,
  });
}

/** Ordinary, non-flagged content — the counterpart probe for moderation_engine_approved. */
export async function sendCleanMessage({ sender, receiver, receiverType = 'user' }: SendProbeMessageOptions) {
  return sendTextMessage({
    sender,
    receiver,
    receiverType,
    text: `ordinary moderation-clean message ${Date.now().toString(36)}`,
  });
}
