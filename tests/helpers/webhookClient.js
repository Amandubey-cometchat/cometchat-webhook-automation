require('dotenv').config();

const RECEIVER_QUERY_URL = process.env.RECEIVER_QUERY_URL || 'http://localhost:4000';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function resetEvents() {
  await fetch(`${RECEIVER_QUERY_URL}/webhook/events`, { method: 'DELETE' });
}

/**
 * Polls the receiver until an event matching `trigger` (and optionally
 * passing `matcher(payload) => boolean`) shows up, or times out.
 *
 * Returns the webhook body (same shape CometChat POSTed) plus a non-enumerable-ish
 * `__event` field carrying receiver-side correlation data: the receiver-assigned
 * `id`, `receivedAt` timestamp, HTTP `method`, and captured `headers` — useful for
 * asserting delivery mechanics, not just payload contents.
 *
 * @param {string} trigger - e.g. 'message_sent'
 * @param {(payload: any) => boolean} [matcher] - extra check, e.g. matching a messageId
 * @param {number} [timeoutMs] - default 10s; webhooks are async, bump this for slower events
 */
async function expectWebhookEvent(trigger, matcher = () => true, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  let allSeenThisWindow = [];

  while (Date.now() < deadline) {
    // Fetch everything currently in the (per-test, reset-in-beforeEach) store
    // — not scoped by a "since" timestamp. A time window here is actively
    // harmful: two webhooks for one action (e.g. message_sent + user_mentioned)
    // can both land within the same test before either wait resolves, and a
    // fresh "now - 1000ms" cutoff on a *later* wait can exclude an event that
    // arrived earlier in the same test but is still exactly what we want.
    // resetEvents() already gives per-test isolation, so nothing further is
    // needed here — everything in the store is relevant to the running test.
    const res = await fetch(`${RECEIVER_QUERY_URL}/webhook/events`);
    const json = await res.json();
    allSeenThisWindow = json.events;
    const match = allSeenThisWindow.find((e) => e.trigger === trigger && matcher(e.payload));
    if (match) {
      return Object.assign({}, match.payload, {
        __event: { id: match.id, receivedAt: match.receivedAt, method: match.method, headers: match.headers },
      });
    }
    await sleep(500);
  }

  const seen = allSeenThisWindow.length
    ? allSeenThisWindow
        .map((e) => `  - ${e.trigger} at ${new Date(e.receivedAt).toISOString()} (event id: ${e.id || 'n/a'})`)
        .join('\n')
    : '  (no webhook events of any kind arrived in this window)';
  throw new Error(
    `Timed out waiting for webhook event "${trigger}" after ${timeoutMs}ms.\n` +
      `Events actually received in this window:\n${seen}`
  );
}

/**
 * Waits for the first matching event (same as expectWebhookEvent), then keeps
 * polling for an extra `settleMs` to catch any late, duplicate delivery of
 * the same event (e.g. a retried webhook after a slow/failed first attempt).
 * Fails if more than one event matches.
 *
 * @param {string} trigger
 * @param {(payload: any) => boolean} matcher - should be specific enough to
 *   identify *this* action only (e.g. match on a unique id/guid you just created).
 * @param {number} [timeoutMs] - time to wait for the first delivery
 * @param {number} [settleMs] - extra time to watch for duplicate deliveries after the first
 */
async function expectSingleWebhookEvent(trigger, matcher, timeoutMs = 10000, settleMs = 4000) {
  await expectWebhookEvent(trigger, matcher, timeoutMs);

  const deadline = Date.now() + settleMs;
  let matches = [];
  while (Date.now() < deadline) {
    const res = await fetch(`${RECEIVER_QUERY_URL}/webhook/events?trigger=${encodeURIComponent(trigger)}`);
    const json = await res.json();
    matches = json.events.filter((e) => matcher(e.payload));
    await sleep(500);
  }

  if (matches.length !== 1) {
    const details = matches
      .map((e) => `  - event id ${e.id || 'n/a'} received at ${new Date(e.receivedAt).toISOString()}`)
      .join('\n');
    throw new Error(
      `Expected exactly 1 "${trigger}" delivery for this action, got ${matches.length} ` +
        `(possible duplicate webhook delivery).\n${details || '  (none matched — see the earlier timeout, if any)'}`
    );
  }

  return Object.assign({}, matches[0].payload, {
    __event: { id: matches[0].id, receivedAt: matches[0].receivedAt, method: matches[0].method, headers: matches[0].headers },
  });
}

/**
 * The inverse of expectWebhookEvent: watches for `windowMs` and fails if a
 * matching event arrives. Use this for negative scenarios — e.g. a rejected
 * API call should never produce the webhook that a successful call would.
 * A shorter, explicit window (not the full positive-case timeout) because
 * we're proving absence, not presence — waiting the full 10s+ for every
 * negative case would make the suite needlessly slow without adding rigor.
 *
 * @param {string} trigger
 * @param {(payload: any) => boolean} [matcher]
 * @param {number} [windowMs] - how long to watch before declaring "did not fire"
 */
async function assertNoWebhookEvent(trigger, matcher = () => true, windowMs = 5000) {
  const deadline = Date.now() + windowMs;

  while (Date.now() < deadline) {
    // No "since" filter — same reasoning as expectWebhookEvent above.
    const res = await fetch(`${RECEIVER_QUERY_URL}/webhook/events?trigger=${encodeURIComponent(trigger)}`);
    const json = await res.json();
    const match = json.events.find((e) => matcher(e.payload));
    if (match) {
      throw new Error(
        `Expected no "${trigger}" webhook for this action, but one arrived: ${JSON.stringify(match.payload).slice(0, 300)}`
      );
    }
    await sleep(500);
  }
}

module.exports = { resetEvents, expectWebhookEvent, expectSingleWebhookEvent, assertNoWebhookEvent };
