# CometChat Webhook Automation

Real end-to-end QA automation for CometChat's Webhooks: trigger events via the
CometChat REST API (no UI needed), capture them on a small Express receiver,
and assert deeply on the payload with Playwright Test. No mocks — every test
run hits a real CometChat app and asserts on a real webhook delivery.

## Folder structure

```
webhook-automation/
  receiver/                    -> Express service CometChat delivers webhooks to
                                   (deployed permanently on Render — see Step 1)
    index.js                   -> POST /webhook, event storage, /dashboard, /test-results
    public/
      dashboard.html           -> visual inspector: raw events + pass/fail/skip test results
    data/
      events-history.json      -> persisted event log (survives restarts; gitignored)
      test-results.json        -> last uploaded test run's report (survives restarts; gitignored)
    .env.example
    package.json
  scripts/
    register-webhooks.js       -> webhook CRUD via CometChat's Management API (see Known limitations)
    upload-test-results.js     -> pushes a local test run's results to the deployed receiver
  tests/
    helpers/
      cometchatApi.js          -> thin wrapper over the CometChat REST API (the "trigger side")
      webhookClient.js         -> polling helpers: expectWebhookEvent, assertNoWebhookEvent, resetEvents
      sdkClient.js             -> real CometChat JS SDK client in a Playwright browser (WebSocket-only triggers)
    specs/
      message.spec.ts          -> message_sent/edited/deleted/reactions/mentions
      group.spec.ts             -> group lifecycle + membership + ownership
      user.spec.ts              -> block/unblock
      duplicate-delivery.spec.ts -> no double-delivery for a single action
      negative.spec.ts          -> rejected actions fire no webhook
      edge-cases.spec.ts        -> unicode, oversized payloads, rapid-fire messages
      sdk-triggers.spec.ts      -> triggers only reachable via a live SDK/WebSocket client
      aggregate-receipts.spec.ts -> message_delivered_to_all / message_read_by_all (group-only)
      webhook-configuration.spec.ts -> documented skips (needs Management API creds)
  webhooks/
    registry.js                -> single source of truth: every CometChat webhook this
                                   project is responsible for, its automation status, and why
  reports/
    webhook-coverage.json      -> generated: per-environment coverage, machine-readable
    webhook-coverage.md        -> generated: same data, human-readable table
  env.js                       -> loads .env.<APP_ENV>, prints the environment banner,
                                   blocks unconfirmed prod runs
  playwright.config.ts
  package.json
  .env.example
```

## Step 0 — Prerequisites

1. A **dedicated CometChat app** for QA/staging (Dashboard → Create App). Do not point this at production.
2. From that app: **App ID**, **Region**, **REST API Key** (fullAccess scope).
3. A public HTTPS URL for the receiver — a permanent deployment is strongly
   preferred over a local tunnel (see "Receiver hosting" below).
4. Node.js 18+.

## Step 1 — Deploy (or run) the receiver

**Permanent (recommended)**: deploy `receiver/` as its own Web Service on
Render (or Fly/Railway) — root directory `receiver`, build command
`npm install`, start command `npm start`, env vars `BASIC_AUTH_USER` /
`BASIC_AUTH_PASS`. Render assigns a stable URL automatically; no code changes
needed since the app already reads `process.env.PORT`.

**Local dev alternative**: run it on your machine and expose it with a
tunnel — but note the tunnel URL changes every time it restarts, so you'll
be re-pasting it into both `.env` and the CometChat Dashboard often:

```bash
cd receiver
npm install
cp .env.example .env      # set BASIC_AUTH_USER / BASIC_AUTH_PASS
npm start                 # listens on :4001
```

```bash
cloudflared tunnel --url http://localhost:4001   # or: ngrok http 4001
```

## Step 2 — Configure the webhook

CometChat's per-app REST API key (`COMETCHAT_REST_API_KEY`) **cannot** create or
edit webhooks — that requires a separate Multi-Tenancy Management API key that
only CometChat Sales provisions (see "Known limitations" below). Until you have
one, configure the webhook by hand:

1. CometChat Dashboard → your app → Webhooks
2. Add your receiver's URL + `/webhook`, enable Basic Auth with the same
   `BASIC_AUTH_USER`/`BASIC_AUTH_PASS` as `receiver/.env`
3. Enable every individual trigger you want covered — note this is a
   **per-trigger** checklist under each category tab (Message/User/Group/etc.),
   not just one toggle per category. It's easy to have a category "on" with
   specific triggers inside it still unchecked.

## Step 3 — Run the tests

```bash
npm install
cp .env.example .env.staging-us   # fill in COMETCHAT_APP_ID, COMETCHAT_REGION,
                                   # COMETCHAT_REST_API_KEY, WEBHOOK_RECEIVER_URL (your
                                   # receiver's /webhook URL), RECEIVER_QUERY_URL (its
                                   # base URL, no path) — see "Multiple environments" below
npm run test:staging
```

Environment-specific entry points (each loads only that environment's
`.env.<name>` — see "Multiple environments" below):

```bash
npm run test:staging      # APP_ENV=staging-us, no confirmation needed
npm run test:prod:eu      # APP_ENV=prod-eu,  requires the confirmation baked into the script
npm run test:prod:us      # APP_ENV=prod-us,  same
npm run test:prod:in      # APP_ENV=prod-in,  same
```

Every one of these runs the full suite serially against that real CometChat
app (parallel runs would race on the receiver's shared event store — see
`playwright.config.ts`), then regenerates `reports/webhook-coverage.{json,md}`
for that environment (see "Webhook coverage registry & report" below).
`npm run test:webhooks` additionally uploads results to the receiver so the
deployed dashboard's Test Results tab reflects them (uses whatever `APP_ENV`
is already set in your shell, defaulting to staging-us — see "Receiver
hosting" below for why that upload step exists).

Useful variants:
- `npm run test:staging -- --grep group` / `npm run test:prod:eu -- --grep message` —
  just one category (Playwright's own `--grep`, passed through)
- `npx playwright test tests/specs/message.spec.ts` — just one spec file
  (loads `APP_ENV` from your shell — export it first, or prefix the command)
- `npx playwright show-report` — HTML report after a run
- `npm run coverage` — regenerate `reports/webhook-coverage.*` from the last
  run's `test-results/results.json` without re-running anything

## Step 4 — Watch it live

```
<your receiver URL>/dashboard
```

Two tabs:
- **Webhook Events** — every raw payload CometChat has ever delivered, grouped
  by trigger, persisted in `receiver/data/events-history.json` across restarts
- **Test Results** — the last uploaded test run's pass/fail/skip breakdown.
  Click any row to see the exact assertion error (for a failure) or the
  documented reason (for a skip).

## Receiver hosting

This project's receiver is deployed permanently on Render rather than run
through a local tunnel — Cloudflare's free "quick tunnels"
(`cloudflared tunnel --url ...`) hand out a random URL on every restart with
no way to keep it stable, and the underlying connection isn't reliable
long-term (observed dying silently overnight). A deployed receiver means the
CometChat Dashboard's webhook URL is configured **once**, permanently.

One consequence: since tests run from a developer's machine but the receiver
runs elsewhere, the receiver can't read `test-results/results.json` off a
filesystem it doesn't share. `scripts/upload-test-results.js` POSTs the
report to the receiver's `POST /test-results` endpoint instead — this runs
automatically via `npm run test:webhooks`.

## Multiple environments

This suite can target different CometChat apps — e.g. a staging app and
several regional production apps — via `env.js`, which loads
`.env.<APP_ENV>` instead of a single bare `.env`:

```bash
npm run test:staging                                  # APP_ENV=staging-us
npm run test:prod:eu                                   # APP_ENV=prod-eu, confirmed
# equivalent, if you need raw playwright flags (e.g. --grep):
APP_ENV=prod-eu CONFIRM_PROD=yes npx playwright test --grep group
```

`APP_ENV` must be one of `staging-us`, `prod-us`, `prod-eu`, `prod-in`. Any
`prod-*` target is refused unless `CONFIRM_PROD=yes` is also set — this
suite creates/deletes groups, sends messages, and bans/blocks users, so a
stray or forgotten `APP_ENV` should never silently run against a real
production app. Every run prints a banner (`Environment: PROD-EU`, app ID,
region) before a single test executes, so which environment a run targeted
is never ambiguous in the log.

**Set up a new environment**:
1. `cp .env.example .env.<name>` and fill in that app's App ID, Region, and REST API Key
2. Deploy a **separate, dedicated** Render receiver for it (don't share one
   across environments — keeps prod and staging fully isolated). Same steps
   as "Step 1" above, just a new Render Web Service from the same repo.
3. Fill in that receiver's URL as `WEBHOOK_RECEIVER_URL`/`RECEIVER_QUERY_URL`
   in the new `.env.<name>` file
4. Create the two fixed test users this suite expects (`qa-user-1`, `qa-user-2`)
   on that app — they're never created automatically by the test run itself:
   ```bash
   APP_ENV=<name> node -e "
     const { createTestUser } = require('./tests/helpers/cometchatApi');
     Promise.all([createTestUser('qa-user-1','qa-user-1'), createTestUser('qa-user-2','qa-user-2')]);
   "
   ```
5. Add a **new, separate** webhook on that app in the Dashboard (Step 2 above)
   pointing at the new receiver — never repoint an existing webhook that
   might already drive real business logic on a prod app

## Webhook coverage registry & report

`webhooks/registry.js` is the single source of truth for every CometChat
webhook this project is responsible for — 51 across GROUP, MESSAGE, CALL &
MEETING, CAMPAIGN, USER, and MODERATION. Each entry carries its category,
what actually triggers it, the automation method (REST/SDK/none), the real
payload fields a passing test asserts on, and a status:

- **AUTOMATED** — a real test exists and asserts on a real, live-verified payload
- **NOT_IMPLEMENTED** — believed achievable with what's already available, just not built yet (with a reason)
- **BLOCKED** — genuinely can't be triggered with what's currently available — missing product module/credentials, or a Dashboard-only human action with no API equivalent (with a reason)

`scripts/generate-coverage-report.js` (wired into every `test:*` script, or
run standalone as `npm run coverage`) cross-references the registry against
the most recent local Playwright run for whichever `APP_ENV` it targeted,
prints a console report, and writes/updates:
- `reports/webhook-coverage.json` — accumulates one slice per environment, so running staging today and prod-eu tomorrow builds up a combined multi-environment picture rather than overwriting each other
- `reports/webhook-coverage.md` — the same data as a table

**Current coverage (last run, prod-eu, 2026-09-04): 24 AUTOMATED (all pass), 2 NOT_IMPLEMENTED, 25 BLOCKED, 51 total.**

**Adding a new webhook**: add one entry to the relevant array in
`webhooks/registry.js` (`id`, `trigger`, `expectedEvent`, `automationMethod`,
`expectedPayloadKeys`, and either `status: 'AUTOMATED'` with `specFile`/
`testTitleMatch` pointing at a real test, or `status: 'BLOCKED'`/
`'NOT_IMPLEMENTED'` with a `reason`). Nothing else needs to change — the
report picks it up automatically.

## Known limitations

Not every CometChat webhook trigger can be exercised by REST alone.
`group_member_joined`/`left`, delivery/read receipts, connection status, and
the group-only aggregate receipts (`message_delivered_to_all`/
`message_read_by_all`) only fire from a real, connected SDK client
(WebSocket) — `sdk-triggers.spec.ts` and `aggregate-receipts.spec.ts` cover
these for real by driving the actual CometChat JS SDK inside a
Playwright-controlled browser (`tests/helpers/sdkClient.js`), logged in via a
server-generated Auth Token. Not a mock — a real client session.

What's still genuinely out of reach, documented as explicit, reasoned gaps
(not silently omitted) so they stay visible — see `webhooks/registry.js` for
the authoritative, per-webhook version of this:

| Trigger(s) | Why it's blocked | Where |
| --- | --- | --- |
| Webhook create/update/enable/disable/delete, add/remove trigger | Needs a Multi-Tenancy Management API key (`COMETCHAT_MGMT_KEY`/`SECRET`) from CometChat Sales — the per-app REST key 404s against `apimgmt.cometchat.io` | `webhook-configuration.spec.ts` (not part of the 51-webhook registry — this is CRUD on webhook *configuration*, not a webhook event itself) |
| Call & Meeting events (14), Campaign/Notification events (10) | This project has no Calls SDK or Campaigns module integration on any environment, and no confirmation those add-ons are even enabled on any of the 4 apps. Building tests against a mocked/simulated session would violate "never fake a PASS" | `webhooks/registry.js` (category `CALL & MEETING`, `CAMPAIGN`) |
| `moderation_engine_blocked`, `moderation_engine_approved` | See "Moderation" below — the trigger condition this project previously relied on no longer reproduces; most likely the Moderation webhook trigger category just isn't checked in the Dashboard, same pattern found for Group triggers | `webhooks/registry.js` (category `MODERATION`) |
| `moderation_manual_approved` | Dashboard-only human action (an admin manually approving flagged content) — no REST/SDK equivalent exists | `webhooks/registry.js` (category `MODERATION`) |

## CometChat's built-in Moderation Engine

If your app has Moderation enabled (Dashboard → your app → Moderation), be
aware it can silently block test messages before any `message_sent` webhook
fires — observed live (pre-2026-09-03, prod-eu): a raw 10+ digit timestamp
embedded in message text got pattern-matched as a phone number ("Contact
details filter"), and a single character repeated thousands of times read as
spam. This suite avoids both (see `Date.now().toString(36)` and the
`fillerText()` helper in `edge-cases.spec.ts`), but flood/rate-style rules
can still produce inconsistent false positives on otherwise-safe traffic
under rapid, repeated test runs. For a pure webhook-QA app, disabling
Moderation entirely is the simplest way to avoid this class of flakiness.

**Update, 2026-09-04**: re-probed live against prod-eu with the same
phone-pattern text that previously triggered a block — it now sends cleanly
as `message_sent`, not `moderation_engine_blocked`. The message's own
metadata shows a moderation extension did run
(`data.message.data.metadata['@injected'].extensions['human-moderation'].success: true`),
but no `moderation_engine_blocked`/`moderation_engine_approved` **webhook**
fired either way. Most likely explanation, based on this project's prior
experience with Group triggers (a category can show "on" while its
individual trigger checkboxes are unchecked): the Moderation trigger
category needs to be explicitly enabled in the webhook's trigger
configuration in the Dashboard. Needs a Dashboard check — see
`webhooks/registry.js`'s `MODERATION` entries for the full reasoning.

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
