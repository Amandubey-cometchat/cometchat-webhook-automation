export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Webhooks are asynchronous, and different trigger kinds have observed very
// different real-world latency (verified live against prod-eu):
//   - most REST-triggered events: well under 5s
//   - group_member_joined/left (SDK-only): up to ~25-30s
//   - delivery/read receipts, connection status (SDK-only): up to ~15-20s
// These are the *default* budgets a caller can override per wait, not hard limits.
export const DEFAULT_WEBHOOK_TIMEOUT_MS = 10000;
export const GROUP_MEMBERSHIP_TIMEOUT_MS = 35000;
export const RECEIPT_TIMEOUT_MS = 20000;
export const NEGATIVE_CASE_WINDOW_MS = 5000;
export const DUPLICATE_SETTLE_WINDOW_MS = 4000;
