# CometChat Webhook Coverage Matrix

_Generated 2026-09-04T13:42:55.801Z from `webhooks/registry.js`, cross-referenced with the latest local test run per environment._

| Category | Webhook | Method | PROD-EU |
|---|---|---|---|
| GROUP | group_created | REST | PASSED |
| GROUP | group_updated | REST | PASSED |
| GROUP | group_deleted | REST | PASSED |
| GROUP | group_member_added | REST | PASSED |
| GROUP | group_member_kicked | REST | PASSED |
| GROUP | group_member_banned | REST | PASSED |
| GROUP | group_member_unbanned | REST | PASSED |
| GROUP | group_member_scope_changed | REST | PASSED |
| GROUP | group_owner_transferred | REST | PASSED |
| GROUP | group_member_joined | SDK | PASSED |
| GROUP | group_member_left | SDK | PASSED |
| MESSAGE | message_sent | REST | PASSED |
| MESSAGE | message_edited | REST | PASSED |
| MESSAGE | message_deleted | REST | PASSED |
| MESSAGE | message_reaction_added | REST | PASSED |
| MESSAGE | message_reaction_removed | REST | PASSED |
| MESSAGE | user_mentioned | REST | PASSED |
| MESSAGE | message_delivery_receipt | SDK | PASSED |
| MESSAGE | message_read_receipt | SDK | PASSED |
| MESSAGE | message_delivered_to_all | SDK | PASSED |
| MESSAGE | message_read_by_all | SDK | PASSED |
| CALL & MEETING | meeting_participant_joined | NONE | BLOCKED |
| CALL & MEETING | recording_generated | NONE | BLOCKED |
| CALL & MEETING | meeting_participant_left | NONE | BLOCKED |
| CALL & MEETING | call_participant_left | NONE | BLOCKED |
| CALL & MEETING | call_ended | NONE | BLOCKED |
| CALL & MEETING | meeting_started | NONE | BLOCKED |
| CALL & MEETING | call_unanswered | NONE | BLOCKED |
| CALL & MEETING | call_cancelled | NONE | BLOCKED |
| CALL & MEETING | call_initiated | NONE | BLOCKED |
| CALL & MEETING | call_participant_joined | NONE | BLOCKED |
| CALL & MEETING | meeting_ended | NONE | BLOCKED |
| CALL & MEETING | call_busy | NONE | BLOCKED |
| CALL & MEETING | call_rejected | NONE | BLOCKED |
| CALL & MEETING | call_started | NONE | BLOCKED |
| CAMPAIGN | after_campaign_completed | NONE | BLOCKED |
| CAMPAIGN | after_campaign_failed | NONE | BLOCKED |
| CAMPAIGN | after_feed_item_read | NONE | BLOCKED |
| CAMPAIGN | after_feed_item_interacted | NONE | BLOCKED |
| CAMPAIGN | after_feed_item_sent | NONE | BLOCKED |
| CAMPAIGN | after_push_notification_clicked | NONE | BLOCKED |
| CAMPAIGN | after_notification_created | NONE | BLOCKED |
| CAMPAIGN | after_feed_item_delivered | NONE | BLOCKED |
| CAMPAIGN | after_push_notification_sent | NONE | BLOCKED |
| CAMPAIGN | after_push_notification_delivered | NONE | BLOCKED |
| USER | user_blocked | REST | PASSED |
| USER | user_unblocked | REST | PASSED |
| USER | user_connection_status_changed | SDK | PASSED |
| MODERATION | moderation_engine_blocked | REST | NOT_IMPLEMENTED |
| MODERATION | moderation_engine_approved | REST | NOT_IMPLEMENTED |
| MODERATION | moderation_manual_approved | NONE | BLOCKED |

## Totals per environment

| Environment | Total | Passed | Failed | Skipped | Not implemented | Blocked |
|---|---|---|---|---|---|---|
| prod-eu | 51 | 24 | 0 | 0 | 2 | 25 |
