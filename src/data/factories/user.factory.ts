/**
 * Fixed test users, reused across every environment (staging-us, prod-us,
 * prod-eu, prod-in) rather than created fresh per test run — explicit
 * project decision. Each environment must have these two users created once
 * (see README "Multiple environments" → step 4) before tests can run.
 */
export const QA_USER_1 = 'qa-user-1';
export const QA_USER_2 = 'qa-user-2';
