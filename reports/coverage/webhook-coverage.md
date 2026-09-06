# CometChat Webhook Coverage Matrix

_Generated 2026-09-06T16:03:10.047Z from `src/registry/webhook.registry.ts`, cross-referenced with the latest local test run per environment._

| Category | Webhook | Method | PROD-EU | PROD-US | PROD-IN |
|---|---|---|---|---|---|
| GROUP | group_created | REST | PASSED | PASSED | FAILED |
| GROUP | group_updated | REST | PASSED | PASSED | FAILED |
| GROUP | group_deleted | REST | PASSED | PASSED | FAILED |
| GROUP | group_member_added | REST | PASSED | PASSED | FAILED |
| GROUP | group_member_kicked | REST | PASSED | PASSED | FAILED |
| GROUP | group_member_banned | REST | PASSED | PASSED | PASSED |
| GROUP | group_member_unbanned | REST | PASSED | PASSED | PASSED |
| GROUP | group_member_scope_changed | REST | PASSED | PASSED | FAILED |
| GROUP | group_owner_transferred | REST | PASSED | PASSED | FAILED |
| GROUP | group_member_joined | SDK | PASSED | PASSED | FAILED |
| GROUP | group_member_left | SDK | PASSED | PASSED | FAILED |
| MESSAGE | message_sent | REST | PASSED | PASSED | FAILED |
| MESSAGE | message_edited | REST | PASSED | PASSED | FAILED |
| MESSAGE | message_deleted | REST | PASSED | PASSED | FAILED |
| MESSAGE | message_reaction_added | REST | PASSED | PASSED | FAILED |
| MESSAGE | message_reaction_removed | REST | PASSED | PASSED | FAILED |
| MESSAGE | user_mentioned | REST | PASSED | PASSED | FAILED |
| MESSAGE | message_delivery_receipt | SDK | PASSED | PASSED | FAILED |
| MESSAGE | message_read_receipt | SDK | PASSED | PASSED | FAILED |
| MESSAGE | message_delivered_to_all | SDK | PASSED | PASSED | FAILED |
| MESSAGE | message_read_by_all | SDK | PASSED | PASSED | FAILED |
| MESSAGE | message_pinned | REST | NOT_IMPLEMENTED | — | — |
| MESSAGE | message_unpinned | REST | NOT_IMPLEMENTED | — | — |
| MESSAGE | conversation_pinned | REST | NOT_IMPLEMENTED | — | — |
| MESSAGE | conversation_unpinned | REST | NOT_IMPLEMENTED | — | — |
| CALLS | call_initiated | NONE | BLOCKED | BLOCKED | BLOCKED |
| CALLS | call_started | NONE | BLOCKED | BLOCKED | BLOCKED |
| CALLS | call_participant_joined | NONE | BLOCKED | BLOCKED | BLOCKED |
| CALLS | call_participant_left | NONE | BLOCKED | BLOCKED | BLOCKED |
| CALLS | call_ended | NONE | BLOCKED | BLOCKED | BLOCKED |
| CALLS | call_unanswered | NONE | BLOCKED | BLOCKED | BLOCKED |
| CALLS | call_cancelled | NONE | BLOCKED | BLOCKED | BLOCKED |
| CALLS | call_busy | NONE | BLOCKED | BLOCKED | BLOCKED |
| CALLS | call_rejected | NONE | BLOCKED | BLOCKED | BLOCKED |
| MEETINGS | meeting_started | NONE | BLOCKED | BLOCKED | BLOCKED |
| MEETINGS | meeting_participant_joined | NONE | BLOCKED | BLOCKED | BLOCKED |
| MEETINGS | meeting_participant_left | NONE | BLOCKED | BLOCKED | BLOCKED |
| MEETINGS | meeting_ended | NONE | BLOCKED | BLOCKED | BLOCKED |
| MEETINGS | recording_generated | NONE | BLOCKED | BLOCKED | BLOCKED |
| MEETINGS | transcription_generated | NONE | BLOCKED | — | — |
| CAMPAIGN | after_campaign_completed | NONE | BLOCKED | BLOCKED | BLOCKED |
| CAMPAIGN | after_campaign_failed | NONE | BLOCKED | BLOCKED | BLOCKED |
| CAMPAIGN | after_feed_item_read | NONE | BLOCKED | BLOCKED | BLOCKED |
| CAMPAIGN | after_feed_item_interacted | NONE | BLOCKED | BLOCKED | BLOCKED |
| CAMPAIGN | after_feed_item_sent | NONE | BLOCKED | BLOCKED | BLOCKED |
| CAMPAIGN | after_push_notification_clicked | NONE | BLOCKED | BLOCKED | BLOCKED |
| CAMPAIGN | after_notification_created | NONE | BLOCKED | BLOCKED | BLOCKED |
| CAMPAIGN | after_feed_item_delivered | NONE | BLOCKED | BLOCKED | BLOCKED |
| CAMPAIGN | after_push_notification_sent | NONE | BLOCKED | BLOCKED | BLOCKED |
| CAMPAIGN | after_push_notification_delivered | NONE | BLOCKED | BLOCKED | BLOCKED |
| USER | user_blocked | REST | PASSED | PASSED | FAILED |
| USER | user_unblocked | REST | PASSED | PASSED | FAILED |
| USER | user_connection_status_changed | SDK | PASSED | PASSED | FAILED |
| MODERATION | moderation_engine_blocked | REST | PASSED | NOT_IMPLEMENTED | NOT_IMPLEMENTED |
| MODERATION | moderation_engine_approved | REST | PASSED | NOT_IMPLEMENTED | NOT_IMPLEMENTED |
| MODERATION | moderation_manual_approved | NONE | BLOCKED | BLOCKED | BLOCKED |

## Totals per environment

| Environment | Total | Passed | Failed | Skipped | Not implemented | Blocked |
|---|---|---|---|---|---|---|
| prod-eu | 56 | 26 | 0 | 0 | 4 | 26 |
| prod-us | 51 | 24 | 0 | 0 | 2 | 25 |
| prod-in | 51 | 2 | 22 | 0 | 2 | 25 |
