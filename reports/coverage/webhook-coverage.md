# CometChat Webhook Coverage Matrix

_Generated 2026-09-04T17:07:04.360Z from `src/registry/webhook.registry.ts`, cross-referenced with the latest local test run per environment._

| Category | Webhook | Method | PROD-EU | PROD-US |
|---|---|---|---|---|
| GROUP | group_created | REST | PASSED | PASSED |
| GROUP | group_updated | REST | PASSED | PASSED |
| GROUP | group_deleted | REST | PASSED | PASSED |
| GROUP | group_member_added | REST | PASSED | PASSED |
| GROUP | group_member_kicked | REST | PASSED | PASSED |
| GROUP | group_member_banned | REST | PASSED | PASSED |
| GROUP | group_member_unbanned | REST | PASSED | PASSED |
| GROUP | group_member_scope_changed | REST | PASSED | PASSED |
| GROUP | group_owner_transferred | REST | PASSED | PASSED |
| GROUP | group_member_joined | SDK | PASSED | PASSED |
| GROUP | group_member_left | SDK | PASSED | PASSED |
| MESSAGE | message_sent | REST | PASSED | PASSED |
| MESSAGE | message_edited | REST | PASSED | PASSED |
| MESSAGE | message_deleted | REST | PASSED | PASSED |
| MESSAGE | message_reaction_added | REST | PASSED | PASSED |
| MESSAGE | message_reaction_removed | REST | PASSED | PASSED |
| MESSAGE | user_mentioned | REST | PASSED | PASSED |
| MESSAGE | message_delivery_receipt | SDK | PASSED | PASSED |
| MESSAGE | message_read_receipt | SDK | PASSED | PASSED |
| MESSAGE | message_delivered_to_all | SDK | PASSED | PASSED |
| MESSAGE | message_read_by_all | SDK | PASSED | PASSED |
| CALLS | call_initiated | NONE | BLOCKED | BLOCKED |
| CALLS | call_started | NONE | BLOCKED | BLOCKED |
| CALLS | call_participant_joined | NONE | BLOCKED | BLOCKED |
| CALLS | call_participant_left | NONE | BLOCKED | BLOCKED |
| CALLS | call_ended | NONE | BLOCKED | BLOCKED |
| CALLS | call_unanswered | NONE | BLOCKED | BLOCKED |
| CALLS | call_cancelled | NONE | BLOCKED | BLOCKED |
| CALLS | call_busy | NONE | BLOCKED | BLOCKED |
| CALLS | call_rejected | NONE | BLOCKED | BLOCKED |
| MEETINGS | meeting_started | NONE | BLOCKED | BLOCKED |
| MEETINGS | meeting_participant_joined | NONE | BLOCKED | BLOCKED |
| MEETINGS | meeting_participant_left | NONE | BLOCKED | BLOCKED |
| MEETINGS | meeting_ended | NONE | BLOCKED | BLOCKED |
| MEETINGS | recording_generated | NONE | BLOCKED | BLOCKED |
| CAMPAIGN | after_campaign_completed | NONE | BLOCKED | BLOCKED |
| CAMPAIGN | after_campaign_failed | NONE | BLOCKED | BLOCKED |
| CAMPAIGN | after_feed_item_read | NONE | BLOCKED | BLOCKED |
| CAMPAIGN | after_feed_item_interacted | NONE | BLOCKED | BLOCKED |
| CAMPAIGN | after_feed_item_sent | NONE | BLOCKED | BLOCKED |
| CAMPAIGN | after_push_notification_clicked | NONE | BLOCKED | BLOCKED |
| CAMPAIGN | after_notification_created | NONE | BLOCKED | BLOCKED |
| CAMPAIGN | after_feed_item_delivered | NONE | BLOCKED | BLOCKED |
| CAMPAIGN | after_push_notification_sent | NONE | BLOCKED | BLOCKED |
| CAMPAIGN | after_push_notification_delivered | NONE | BLOCKED | BLOCKED |
| USER | user_blocked | REST | PASSED | PASSED |
| USER | user_unblocked | REST | PASSED | PASSED |
| USER | user_connection_status_changed | SDK | PASSED | PASSED |
| MODERATION | moderation_engine_blocked | REST | NOT_IMPLEMENTED | NOT_IMPLEMENTED |
| MODERATION | moderation_engine_approved | REST | NOT_IMPLEMENTED | NOT_IMPLEMENTED |
| MODERATION | moderation_manual_approved | NONE | BLOCKED | BLOCKED |

## Totals per environment

| Environment | Total | Passed | Failed | Skipped | Not implemented | Blocked |
|---|---|---|---|---|---|---|
| prod-eu | 51 | 24 | 0 | 0 | 2 | 25 |
| prod-us | 51 | 24 | 0 | 0 | 2 | 25 |
