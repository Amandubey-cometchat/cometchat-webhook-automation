/**
 * Generates the webhook coverage report from webhooks/registry.js (the
 * single source of truth for every webhook this project is responsible for)
 * cross-referenced with the most recent local Playwright run
 * (test-results/results.json), for whichever environment that run targeted.
 *
 * Writes:
 *   reports/webhook-coverage.json - machine-readable, accumulates one slice per environment
 *   reports/webhook-coverage.md   - human-readable table, regenerated from the json each run
 * Prints a console report in the same shape.
 *
 * Run after a test run: `node scripts/generate-coverage-report.js`
 * (already wired into `npm run test:webhooks` and the `test:staging`/`test:prod:*` scripts).
 *
 * Deliberately does NOT require ./env — this script only reads local JSON
 * files (test-results/results.json, its .run-env.json marker, the registry)
 * and never talks to CometChat, so it shouldn't need credentials or be
 * subject to the prod-confirmation gate to run standalone.
 */
const fs = require('fs');
const path = require('path');
const { REGISTRY, CATEGORIES } = require('../webhooks/registry');

const RESULTS_FILE = path.join(__dirname, '..', 'test-results', 'results.json');
const RUN_ENV_MARKER = path.join(__dirname, '..', 'test-results', '.run-env.json');
const COVERAGE_JSON = path.join(__dirname, '..', 'reports', 'webhook-coverage.json');
const COVERAGE_MD = path.join(__dirname, '..', 'reports', 'webhook-coverage.md');

// The environment that actually produced test-results/results.json — stamped
// by playwright.config.ts at the start of that run — NOT this script's own
// process.env.APP_ENV. Those two only agree when this script runs as part of
// the same test:* chain that just produced results.json; running `npm run
// coverage` standalone with a different (or no) APP_ENV must not silently
// relabel a stale, different environment's results as the current one.
function resolveRunEnvironment() {
  let marker = null;
  try {
    marker = JSON.parse(fs.readFileSync(RUN_ENV_MARKER, 'utf-8'));
  } catch {
    // No marker — either results.json predates this mechanism, or there's no
    // run at all yet. Fall back to the current process's own APP_ENV, but say so.
  }
  if (marker && marker.APP_ENV) return marker.APP_ENV;
  console.warn(
    `[coverage] No test-results/.run-env.json marker found — falling back to this process's own ` +
      `APP_ENV ("${process.env.APP_ENV || 'staging-us'}"). This may not be the environment that actually ` +
      `produced test-results/results.json. Run via npm run test:staging / test:prod:* to avoid this.`
  );
  return process.env.APP_ENV || 'staging-us';
}

function flattenSpecs(suite, fileTitle, out) {
  for (const spec of suite.specs || []) {
    const t = spec.tests && spec.tests[0];
    const result = t && t.results && t.results[t.results.length - 1];
    if (!t || !result) continue;
    out.push({ file: fileTitle, title: spec.title, status: result.status, ok: spec.ok, error: result.error ? result.error.message : null });
  }
  for (const child of suite.suites || []) flattenSpecs(child, fileTitle, out);
}

function loadLatestRunResults() {
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf-8'));
  } catch {
    return null;
  }
  const flat = [];
  for (const suite of raw.suites || []) flattenSpecs(suite, suite.file || suite.title, flat);
  return { flat, stats: raw.stats || null };
}

// Cross-references one registry entry against the flattened Playwright results
// for the file it lives in, matching on testTitleMatch as a substring of the
// real spec title — deliberately loose (not exact-equal) so minor title
// wording changes don't silently break correlation.
function resolveActualStatus(entry, runResults) {
  if (entry.status === 'BLOCKED' || entry.status === 'NOT_IMPLEMENTED') {
    return { runStatus: entry.status, error: null };
  }
  if (!runResults) return { runStatus: 'AUTOMATED (no run data)', error: null };

  const specFileName = entry.specFile ? entry.specFile.split('/').pop() : null;
  const match = runResults.flat.find(
    (r) => r.file === specFileName && entry.testTitleMatch && r.title.includes(entry.testTitleMatch)
  );
  if (!match) return { runStatus: 'AUTOMATED (not in last run)', error: null };
  if (match.status === 'skipped') return { runStatus: 'SKIPPED', error: null };
  if (!match.ok) return { runStatus: 'FAILED', error: match.error };
  return { runStatus: 'PASSED', error: null };
}

function buildReport(appEnv) {
  const runResults = loadLatestRunResults();
  const rows = REGISTRY.map((entry) => {
    const { runStatus, error } = resolveActualStatus(entry, runResults);
    return { ...entry, runStatus, error };
  });

  const counts = { Total: rows.length, PASSED: 0, FAILED: 0, SKIPPED: 0, NOT_IMPLEMENTED: 0, BLOCKED: 0, OTHER: 0 };
  for (const r of rows) {
    if (r.runStatus === 'PASSED') counts.PASSED++;
    else if (r.runStatus === 'FAILED') counts.FAILED++;
    else if (r.runStatus === 'SKIPPED') counts.SKIPPED++;
    else if (r.status === 'NOT_IMPLEMENTED') counts.NOT_IMPLEMENTED++;
    else if (r.status === 'BLOCKED') counts.BLOCKED++;
    else counts.OTHER++;
  }

  return {
    environment: appEnv,
    generatedAt: new Date().toISOString(),
    counts,
    rows,
  };
}

function loadExistingCoverage() {
  try {
    return JSON.parse(fs.readFileSync(COVERAGE_JSON, 'utf-8'));
  } catch {
    return { environments: {} };
  }
}

function saveCoverage(store) {
  fs.mkdirSync(path.dirname(COVERAGE_JSON), { recursive: true });
  fs.writeFileSync(COVERAGE_JSON, JSON.stringify(store, null, 2));
}

function printConsoleReport(report) {
  const line = '='.repeat(56);
  console.log(line);
  console.log('COMETCHAT WEBHOOK AUTOMATION REPORT');
  console.log(line);
  console.log(`Environment: ${report.environment.toUpperCase()}`);
  console.log();

  for (const [category, entries] of Object.entries(CATEGORIES)) {
    console.log(category);
    console.log('-'.repeat(56));
    for (const entry of entries) {
      const row = report.rows.find((r) => r.id === entry.id);
      console.log(`${entry.id.padEnd(30)} ${row.runStatus}`);
    }
    console.log();
  }

  console.log('-'.repeat(56));
  console.log(`TOTAL: ${report.counts.Total}`);
  console.log(`PASSED: ${report.counts.PASSED}`);
  console.log(`FAILED: ${report.counts.FAILED}`);
  console.log(`SKIPPED: ${report.counts.SKIPPED}`);
  console.log(`NOT IMPLEMENTED: ${report.counts.NOT_IMPLEMENTED}`);
  console.log(`BLOCKED: ${report.counts.BLOCKED}`);
  console.log('-'.repeat(56));

  const failed = report.rows.filter((r) => r.runStatus === 'FAILED');
  if (failed.length) {
    console.log();
    console.log('FAILURE DETAILS');
    console.log('-'.repeat(56));
    for (const f of failed) {
      console.log(`Webhook: ${f.id}`);
      console.log(`Expected: ${f.expectedEvent}`);
      console.log(`Reason: ${(f.error || '').split('\n')[0]}`);
      console.log();
    }
  }
}

function writeMarkdownReport(store) {
  const lines = ['# CometChat Webhook Coverage Matrix', ''];
  lines.push(`_Generated ${new Date().toISOString()} from \`webhooks/registry.js\`, cross-referenced with the latest local test run per environment._`);
  lines.push('');
  const envNames = Object.keys(store.environments);
  lines.push(`| Category | Webhook | Method | ${envNames.map((e) => e.toUpperCase()).join(' | ')} |`);
  lines.push(`|---|---|---|${envNames.map(() => '---').join('|')}|`);
  for (const entry of REGISTRY) {
    const cells = envNames.map((e) => {
      const row = store.environments[e].rows.find((r) => r.id === entry.id);
      return row ? row.runStatus : '—';
    });
    lines.push(`| ${entry.category} | ${entry.id} | ${entry.automationMethod} | ${cells.join(' | ')} |`);
  }
  lines.push('');

  lines.push('## Totals per environment');
  lines.push('');
  lines.push('| Environment | Total | Passed | Failed | Skipped | Not implemented | Blocked |');
  lines.push('|---|---|---|---|---|---|---|');
  for (const [env, data] of Object.entries(store.environments)) {
    const c = data.counts;
    lines.push(`| ${env} | ${c.Total} | ${c.PASSED} | ${c.FAILED} | ${c.SKIPPED} | ${c.NOT_IMPLEMENTED} | ${c.BLOCKED} |`);
  }
  lines.push('');

  fs.mkdirSync(path.dirname(COVERAGE_MD), { recursive: true });
  fs.writeFileSync(COVERAGE_MD, lines.join('\n'));
}

function main() {
  const appEnv = resolveRunEnvironment();
  const report = buildReport(appEnv);
  printConsoleReport(report);

  const store = loadExistingCoverage();
  store.environments[appEnv] = report;
  saveCoverage(store);
  writeMarkdownReport(store);

  console.log(`\nWritten: ${path.relative(process.cwd(), COVERAGE_JSON)}, ${path.relative(process.cwd(), COVERAGE_MD)}`);
}

main();
