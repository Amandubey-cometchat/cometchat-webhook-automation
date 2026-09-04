/**
 * Trigger layer for MODERATION webhooks — see src/registry/moderation.registry.ts.
 * sendFlaggedContent/sendCleanContent exist and can be called (they just
 * send real messages), but as of 2026-09-04 neither produces a
 * moderation_engine_blocked/approved webhook — see the registry entries for
 * why. moderation_manual_approved has no trigger function at all: it's a
 * Dashboard-only human action with no REST/SDK path.
 */
import { sendPhonePatternMessage, sendCleanMessage } from '../../clients/moderation.client';

export const sendFlaggedContent = sendPhonePatternMessage;
export const sendCleanContent = sendCleanMessage;
