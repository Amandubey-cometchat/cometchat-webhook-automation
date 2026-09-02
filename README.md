# CometChat Webhook Automation

Real end-to-end QA automation for CometChat's Webhooks: trigger events via the
CometChat REST API (no UI needed), capture them on a small Express receiver,
and assert deeply on the payload with Playwright Test. No mocks — every test
run hits a real CometChat app and asserts on a real webhook delivery.

## Folder structure

```
webhook-automation/
  receiver/                    -> Express service CometChat delivers webhooks to
    index.js                   -> POST /webhook, event storage, /dashboard, /test-results
    public/
      dashboard.html           -> visual inspector: raw events + pass/fail/skip test results
    data/
      events-history.json      -> persisted event log (survives restarts; gitignore this)
    .env.example
    package.json
  scripts/
    register-webhooks.js       -> webhook CRUD via CometChat's Management API (see Known limitations)
  tests/
    helpers/
      cometchatApi.js          -> thin wrapper over the CometChat REST API (the "trigger side")
      webhookClient.js         -> polling helpers: expectWebhookEvent, assertNoWebhookEvent, resetEvents
    specs/
      message.spec.ts          -> message_sent/edited/deleted/reactions/mentions
      group.spec.ts             -> group lifecycle + membership + ownership
      user.spec.ts              -> block/unblock
      duplicate-delivery.spec.ts -> no double-delivery for a single action
      negative.spec.ts          -> rejected actions fire no webhook
      edge-cases.spec.ts        -> unicode, oversized payloads, rapid-fire messages
      webhook-configuration.spec.ts -> documented skips (needs Management API creds)
      unsupported-triggers.spec.ts  -> documented skips (needs a live SDK/WebSocket client)
  playwright.config.ts
  package.json
  .env.example
```

## Step 0 — Prerequisites

1. A **dedicated CometChat app** for QA/staging (Dashboard → Create App). Do not point this at production.
2. From that app: **App ID**, **Region**, **REST API Key** (fullAccess scope).
3. A public HTTPS URL for the receiver:
   - Local dev: `cloudflared tunnel --url http://localhost:4001` (no signup needed) or `ngrok http 4001`
   - CI / "always on": deploy `receiver/` to any Node host (Render/Fly/Railway) so the URL is stable
4. Node.js 18+.

## Step 1 — Start the receiver

```bash
cd receiver
npm install
cp .env.example .env      # set BASIC_AUTH_USER / BASIC_AUTH_PASS
npm start                 # listens on :4001
```

In another terminal, expose it publicly:

```bash
cloudflared tunnel --url http://localhost:4001
# or: ngrok http 4001
```

Copy the `https://...` URL it prints — you'll need it next. **This URL changes every
time the tunnel restarts** — re-paste it into both `.env` (`WEBHOOK_RECEIVER_URL`)
and the CometChat Dashboard's webhook config whenever that happens.

## Step 2 — Configure the webhook

CometChat's per-app REST API key (`COMETCHAT_REST_API_KEY`) **cannot** create or
edit webhooks — that requires a separate Multi-Tenancy Management API key that
only CometChat Sales provisions (see "Known limitations" below). Until you have
one, configure the webhook by hand:

1. CometChat Dashboard → your app → Webhooks
2. Add your tunnel URL + `/webhook`, enable Basic Auth with the same
   `BASIC_AUTH_USER`/`BASIC_AUTH_PASS` as `receiver/.env`
3. Enable every trigger category you want covered (Message, User, Group, at minimum)

## Step 3 — Run the tests

```bash
cd ..
npm install
cp .env.example .env      # fill in COMETCHAT_APP_ID, COMETCHAT_REGION,
                           # COMETCHAT_REST_API_KEY, WEBHOOK_RECEIVER_URL, etc.
npx playwright test
```

This runs the full suite serially against your real CometChat app (parallel
runs would race on the receiver's shared event store — see `playwright.config.ts`).

Useful variants:
- `npx playwright test tests/specs/message.spec.ts` — just one category
- `npx playwright test --grep group` — just tests matching a name
- `npx playwright show-report` — HTML report after a run

## Step 4 — Watch it live

```
http://localhost:4001/dashboard
```

Two tabs:
- **Webhook Events** — every raw payload CometChat has ever delivered, grouped
  by trigger, persisted in `receiver/data/events-history.json` across restarts
- **Test Results** — the last `npx playwright test` run's pass/fail/skip
  breakdown, read live from `test-results/results.json`. Click any row to see
  the exact assertion error (for a failure) or the documented reason (for a skip).

## Known limitations

Not every CometChat webhook trigger can be exercised by this REST-only suite.
These are documented as explicit, reasoned test skips (not silently omitted)
so the gap is visible in every run — see the Test Results dashboard tab:

| Trigger(s) | Why it's blocked | Spec file |
| --- | --- | --- |
| Webhook create/update/enable/disable/delete, add/remove trigger | Needs a Multi-Tenancy Management API key (`COMETCHAT_MGMT_KEY`/`SECRET`) from CometChat Sales — the per-app REST key 404s against `apimgmt.cometchat.io` | `webhook-configuration.spec.ts` |
| `group_member_joined`, `group_member_left` | Only fire from the SDK's client-side `joinGroup()`/`leaveGroup()` over a live WebSocket — no REST equivalent exists (verified live: self-join via REST 401s with `ERR_GROUP_NOT_JOINED`) | `unsupported-triggers.spec.ts` |
| `message_delivery_receipt`, `message_read_receipt` | Only fire when a connected SDK client acknowledges delivery/read — no REST endpoint exists | `unsupported-triggers.spec.ts` |
| `user_connection_status_changed` | Only fires on real WebSocket connect/disconnect — REST can create an auth token but can't open a live connection | `unsupported-triggers.spec.ts` |
| Call & Meeting events (9), Campaign/Notification events (10), Moderation events | Different product surface — needs the Calls SDK, Campaigns module, or Moderation rules configured, none of which exist in this project | not attempted |

Closing any of these gaps for real (not just documenting them) means adding a
browser-based test lane that runs the actual CometChat JS SDK to get a live
WebSocket session — a different kind of harness than this REST-driven suite.

## `scripts/register-webhooks.js`

Automates the manual Dashboard step in Step 2 above, once you have real
`COMETCHAT_MGMT_KEY`/`COMETCHAT_MGMT_SECRET` from CometChat Sales. Fails fast
with a clear message if they're not set. See the file's header comment for
details and caveats (its exact endpoint paths are transcribed from docs, not
live-verified, since this project has never had Management API credentials
to test against).

## Notes

- The receiver keeps two stores: an in-memory one (`events`) that tests reset
  between specs for isolation, and a disk-persisted one (`history`, in
  `receiver/data/events-history.json`) that the dashboard reads and that
  survives restarts. `DELETE /webhook/events` clears only the former;
  `DELETE /webhook/history` clears the latter.
- Webhooks are asynchronous — `webhookClient.js`'s polling helpers retry for
  a few seconds before failing with a debuggable timeout error listing what
  *did* arrive in that window, rather than a bare "timed out".
- Swap the in-memory/JSON-file receiver storage for Redis/Postgres before
  using this as permanent shared CI infrastructure with concurrent runs.
