/**
 * Loads the right .env.<APP_ENV> file for whichever CometChat environment
 * this run targets. Required by every entry point (test helpers, scripts,
 * playwright.config.ts) instead of a bare `require('dotenv').config()`.
 *
 * Defaults to staging-us — the only environment this suite runs against
 * without extra confirmation, since it creates/deletes groups, sends
 * messages, and bans/blocks users. Any `prod-*` target requires an explicit
 * CONFIRM_PROD=yes, so a stray/forgotten APP_ENV never runs against
 * production by accident.
 *
 * Usage:
 *   npx playwright test                                  # staging-us (default)
 *   APP_ENV=prod-eu CONFIRM_PROD=yes npx playwright test  # prod-eu, explicit
 */
'use strict';
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const APP_ENV = process.env.APP_ENV || 'staging-us';
const KNOWN_ENVS = ['staging-us', 'prod-us', 'prod-eu', 'prod-in'];

if (!KNOWN_ENVS.includes(APP_ENV)) {
  console.error(`Unknown APP_ENV "${APP_ENV}". Expected one of: ${KNOWN_ENVS.join(', ')}`);
  process.exit(1);
}

if (APP_ENV.startsWith('prod') && process.env.CONFIRM_PROD !== 'yes') {
  console.error(
    `Refusing to run against "${APP_ENV}" without CONFIRM_PROD=yes.\n` +
      'This suite creates/deletes groups, sends messages, and bans/blocks users — ' +
      'real side effects if pointed at a real production app.\n' +
      `Re-run with: CONFIRM_PROD=yes APP_ENV=${APP_ENV} <command>`
  );
  process.exit(1);
}

const envFile = path.join(__dirname, `.env.${APP_ENV}`);
if (!fs.existsSync(envFile)) {
  console.error(`No env file for APP_ENV="${APP_ENV}" — expected ${envFile}. See .env.example.`);
  process.exit(1);
}

dotenv.config({ path: envFile });
console.log(`[env] ${APP_ENV} — app ${process.env.COMETCHAT_APP_ID} (${process.env.COMETCHAT_REGION})`);

module.exports = { APP_ENV };
