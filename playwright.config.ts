import { defineConfig } from '@playwright/test';
// Loads .env.<APP_ENV> (default staging-us) and fails fast with a clear
// message on an unconfirmed prod target. Doing this here — the first thing
// Playwright loads — means every spec/helper sees a consistent environment
// with no import-order surprises, and prod is blocked before any test runs.
require('./env');

export default defineConfig({
  testDir: './tests/specs',
  timeout: 30000,
  // Tests share one external, stateful receiver (a single in-memory event
  // store keyed by nothing but trigger name) and trigger real side effects
  // against one shared CometChat app — running them in parallel lets one
  // test's resetEvents() wipe out an event another test is still polling
  // for. Keep this suite serial.
  fullyParallel: false,
  workers: 1,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    // Machine-readable results the receiver's /dashboard reads, so the
    // dashboard can show a Passed/Failed/Skipped breakdown alongside the
    // raw webhook payloads — not just "an event arrived" but "did the
    // test that triggered it actually pass".
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  // No browser project needed — these tests hit REST APIs, not a UI.
  // Add a `projects` array with browser UI tests later if you also
  // automate webhook-adjacent flows through the CometChat UIKit UI.
});
