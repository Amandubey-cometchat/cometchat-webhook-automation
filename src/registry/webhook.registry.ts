/**
 * Single source of truth for every CometChat webhook this project is
 * responsible for — 51 across GROUP, MESSAGE, CALLS, MEETINGS, CAMPAIGN,
 * USER, MODERATION. Nothing about coverage status is tracked anywhere else;
 * scripts/generate-coverage.ts, the README's numbers, and the receiver
 * dashboard all derive from this file.
 *
 * This file only aggregates + types the per-category registries below — add
 * a new webhook to its category file, not here.
 */
import { GROUP_REGISTRY } from './group.registry';
import { MESSAGE_REGISTRY } from './message.registry';
import { CALLS_REGISTRY } from './calls.registry';
import { MEETINGS_REGISTRY } from './meetings.registry';
import { CAMPAIGN_REGISTRY } from './campaign.registry';
import { USER_REGISTRY } from './user.registry';
import { MODERATION_REGISTRY } from './moderation.registry';

export type WebhookCategory = 'GROUP' | 'MESSAGE' | 'CALLS' | 'MEETINGS' | 'CAMPAIGN' | 'USER' | 'MODERATION';
export type AutomationMethod = 'REST' | 'SDK' | 'NONE';
export type WebhookStatus = 'AUTOMATED' | 'NOT_IMPLEMENTED' | 'BLOCKED';

export interface WebhookRegistryEntry {
  id: string;
  category: WebhookCategory;
  /** Which environments support this webhook. All 4 environments run the same CometChat platform feature set for GROUP/MESSAGE/USER — the only real per-app variable is whether the Calls/Campaigns add-ons are enabled, which is unconfirmed for every app, so those categories are marked unsupported everywhere until verified. */
  environments: import('../config/config.schema').AppEnvName[];
  trigger: string;
  expectedEvent: string;
  automationMethod: AutomationMethod;
  expectedPayloadKeys: string[];
  status: WebhookStatus;
  specFile: string | null;
  testTitleMatch: string | null;
  reason?: string;
}

export const CATEGORIES: Record<WebhookCategory, WebhookRegistryEntry[]> = {
  GROUP: GROUP_REGISTRY,
  MESSAGE: MESSAGE_REGISTRY,
  CALLS: CALLS_REGISTRY,
  MEETINGS: MEETINGS_REGISTRY,
  CAMPAIGN: CAMPAIGN_REGISTRY,
  USER: USER_REGISTRY,
  MODERATION: MODERATION_REGISTRY,
};

export const REGISTRY: WebhookRegistryEntry[] = Object.values(CATEGORIES).flat();
