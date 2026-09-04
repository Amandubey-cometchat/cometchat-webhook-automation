import { defineConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';
// Loads .env.<APP_ENV> (default staging-us) and fails fast with a clear
// message on an unconfirmed prod target. Doing this here — the first thing
// Playwright loads — means every spec/helper sees a consistent environment
// with no import-order surprises, and prod is blocked before any test runs.
import { getConfig } from './src/config/env';

const { appEnv, appId, region } = getConfig();

// Stamps which environment is actually producing reports/json/results.json.
// scripts/generate-coverage.ts reads this marker rather than its own
// separately-resolved APP_ENV — a report generated standalone (`npm run
// coverage`, no APP_ENV set) would otherwise silently mislabel a stale
// results.json from a *different* environment's last run. Verified live:
// this is exactly how prod-eu's results briefly got mislabeled "staging-us"
// during this project's development.
const jsonReportDir = path.join(__dirname, 'reports', 'json');
fs.mkdirSync(jsonReportDir, { recursive: true });
fs.writeFileSync(path.join(jsonReportDir, '.run-env.json'), JSON.stringify({ APP_ENV: appEnv, appId, region, writtenAt: Date.now() }));

export default defineConfig({
  testDir: './src/tests',
  timeout: 30000,
  // Tests share one external, stateful receiver (a single in-memory event
  // store keyed by nothing but trigger name) and trigger real side effects
  // against one shared CometChat app — running them in parallel lets one
  // test's resetEvents() wipe out an event another test is still polling
  // for. Keep this suite serial.
  fullyParallel: false,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    ['list'],
    // Machine-readable results scripts/generate-coverage.ts cross-references
    // against src/registry/webhook.registry.ts, and the receiver's
    // /dashboard reads via scripts/upload-test-results.ts.
    ['json', { outputFile: 'reports/json/results.json' }],
  ],
  // No browser project needed — these tests hit REST APIs, not a UI. The
  // one exception (src/clients/sdk.client.ts, driving a real CometChat SDK
  // session) launches its own Chromium instance directly via
  // playwright-core's chromium.launch(), independent of this config.
});
