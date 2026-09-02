import { test } from '@playwright/test';

// Webhook configuration (create/update/enable/disable/delete/change URL/
// change subscribed triggers) lives entirely on CometChat's separate
// Multi-Tenancy Management API — https://apimgmt.cometchat.io — not the
// per-app Chat API this project's COMETCHAT_REST_API_KEY authenticates
// against. Confirmed live (2026-08-31): the per-app key gets a 404 against
// apimgmt.cometchat.io, and CometChat's own docs state Multi-Tenancy access
// requires contacting Sales for a separate key+secret pair:
//   "To initiate usage of CometChat's Multi-Tenancy API, it's necessary to
//    reach out to the Sales team to activate it."
// (https://www.cometchat.com/docs/rest-api/management-apis)
//
// These are real, applicable test scenarios — not placeholders — but they
// cannot run without that credential. Recorded as explicit skips (not
// silently omitted) so the gap is visible in every execution report rather
// than only in prose documentation.
//
// test.skip() is called *inside* each test body (rather than the
// `test.skip(title, fn, reason)` declarative form) because only the inline
// form actually attaches the reason string to the JSON reporter output —
// the declarative form silently drops a 3rd argument. Verified live.

const REASON =
  'Blocked: requires CometChat Multi-Tenancy Management API access (separate key+secret from Sales), not available with the per-app COMETCHAT_REST_API_KEY configured for this project.';

test.describe('Webhook configuration (via API)', () => {
  test('create a new webhook via API', () => { test.skip(true, REASON); });
  test('update an existing webhook\'s URL via API', () => { test.skip(true, REASON); });
  test('enable a webhook via API', () => { test.skip(true, REASON); });
  test('disable a webhook via API and confirm no further deliveries occur', () => { test.skip(true, REASON); });
  test('delete a webhook via API and confirm no further deliveries occur', () => { test.skip(true, REASON); });
  test('add a trigger to an existing webhook via API', () => { test.skip(true, REASON); });
  test('remove a trigger from an existing webhook via API', () => { test.skip(true, REASON); });
  test('run multiple concurrent webhook configurations against the same app', () => { test.skip(true, REASON); });
});
