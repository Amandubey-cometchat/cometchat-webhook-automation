/**
 * Generates receiver/public/trigger-categories.json — a flat
 * { "group_created": "GROUP", "message_sent": "MESSAGE", ... } map derived
 * from src/registry/webhook.registry.ts (the single source of truth), so
 * the dashboard can group live webhook events by category without
 * duplicating the registry data by hand.
 *
 * The receiver is a separate, plain-JS deployed service with no access to
 * this project's TypeScript registry at runtime — this script bridges that
 * gap by producing a static asset committed alongside it. Re-run whenever
 * a webhook is added to/removed from the registry:
 *   npx tsx scripts/generate-trigger-categories.ts
 */
import fs from 'fs';
import path from 'path';
import { REGISTRY } from '../src/registry/webhook.registry';

const OUT_FILE = path.join(__dirname, '..', 'receiver', 'public', 'trigger-categories.json');

// Keyed by expectedEvent (the real trigger name CometChat sends), not the
// registry's internal id — those match for every entry except the legacy
// ones, which reuse "message_delivery_receipt"/"message_read_receipt" from
// the modern system under a disambiguated id (see legacy.registry.ts).
// First-write-wins on collisions: REGISTRY's category order (webhook.registry.ts)
// puts MESSAGE before LEGACY specifically so the shared names keep mapping
// to the already-automated modern case for dashboard grouping.
const map: Record<string, string> = {};
for (const entry of REGISTRY) {
  if (map[entry.expectedEvent] === undefined) {
    map[entry.expectedEvent] = entry.category;
  }
}

fs.writeFileSync(OUT_FILE, JSON.stringify(map, null, 2) + '\n');
console.log(`Wrote ${Object.keys(map).length} trigger -> category mappings to ${path.relative(process.cwd(), OUT_FILE)}`);
