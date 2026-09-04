/**
 * Duplicate-delivery detection: after a webhook first arrives, keep watching
 * for a settle window to see if CometChat redelivers it (e.g. after a slow
 * first attempt). Distinguishes an *expected* single delivery from an
 * *unexpected* duplicate — used by duplicate-delivery tests, which assert
 * exactly one delivery per action rather than merely "at least one".
 */
import { fetchEvents, StoredWebhookEvent } from './webhook.store';
import { WebhookMatcher } from './webhook.matcher';
import { sleep } from '../utils/timeout';
import { DUPLICATE_SETTLE_WINDOW_MS } from '../utils/timeout';

export interface DuplicateCheckResult {
  matches: StoredWebhookEvent[];
  isDuplicate: boolean;
}

/** Watches for `settleMs` after a first match was already confirmed present, and returns every matching delivery seen in that window. */
export async function watchForDuplicates(
  trigger: string,
  matcher: WebhookMatcher,
  settleMs: number = DUPLICATE_SETTLE_WINDOW_MS
): Promise<DuplicateCheckResult> {
  const deadline = Date.now() + settleMs;
  let matches: StoredWebhookEvent[] = [];
  while (Date.now() < deadline) {
    const events = await fetchEvents(trigger);
    matches = events.filter((e) => matcher(e.payload));
    await sleep(500);
  }
  return { matches, isDuplicate: matches.length > 1 };
}
