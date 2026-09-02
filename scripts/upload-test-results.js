/**
 * Uploads the just-generated test-results/results.json to the receiver's
 * POST /test-results, so the dashboard's Test Results tab reflects reality
 * even when the receiver runs somewhere other than this machine (e.g.
 * deployed on Render while tests run from a laptop) — it can't read a file
 * off a filesystem it doesn't share.
 *
 * Run automatically after `npm run test:webhooks` (see package.json). Safe
 * to run manually too: `node scripts/upload-test-results.js`.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const RESULTS_FILE = path.join(__dirname, '..', 'test-results', 'results.json');
const RECEIVER_QUERY_URL = process.env.RECEIVER_QUERY_URL || 'http://localhost:4001';
const USER = process.env.WEBHOOK_BASIC_AUTH_USER || 'qa';
const PASS = process.env.WEBHOOK_BASIC_AUTH_PASS || 'change-me';

(async () => {
  let report;
  try {
    report = fs.readFileSync(RESULTS_FILE, 'utf-8');
  } catch (err) {
    console.error(`No results file at ${RESULTS_FILE} — did the test run generate one? (${err.message})`);
    process.exit(1);
  }

  const res = await fetch(`${RECEIVER_QUERY_URL}/test-results`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + Buffer.from(`${USER}:${PASS}`).toString('base64'),
    },
    body: report,
  });

  if (!res.ok) {
    console.error(`Upload failed: ${res.status} ${await res.text()}`);
    process.exit(1);
  }

  console.log(`Test results uploaded to ${RECEIVER_QUERY_URL}/dashboard`);
})();
