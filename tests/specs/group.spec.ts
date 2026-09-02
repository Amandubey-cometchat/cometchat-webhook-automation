import { test, expect } from '@playwright/test';
// @ts-ignore - plain JS helper modules
const {
  createGroup,
  updateGroup,
  deleteGroup,
  addGroupMembers,
  kickGroupMember,
  changeMemberScope,
  transferGroupOwnership,
  banGroupMember,
  unbanGroupMember,
} = require('../helpers/cometchatApi');
// @ts-ignore
const { resetEvents, expectWebhookEvent } = require('../helpers/webhookClient');

const OWNER = 'qa-user-1';
const MEMBER = 'qa-user-2';

let currentGuid: string | undefined;

function uniqueGuid(prefix: string) {
  currentGuid = `${prefix}-${Date.now()}`;
  return currentGuid;
}

test.beforeEach(async () => {
  await resetEvents();
});

// Every test creates a group against the real CometChat app — clean it up
// afterward so repeated runs don't leave permanent clutter. Safe to no-op
// for the group_deleted test, which already deleted it itself.
test.afterEach(async () => {
  if (currentGuid) {
    // No onBehalfOf here deliberately — cleanup uses the raw admin API key
    // so it can't be blocked by a mid-test scope/ownership change (e.g. the
    // owner-transfer test leaves qa-user-1 without owner rights).
    // @ts-ignore
    await require('../helpers/cometchatApi').deleteGroup(currentGuid).catch(() => {});
    currentGuid = undefined;
  }
});

test('group_created webhook fires with correct guid, name, type and owner', async () => {
  const guid = uniqueGuid('qa-group-created');

  const created = await createGroup({ guid, name: 'QA Created Group', onBehalfOf: OWNER });

  const payload = await expectWebhookEvent('group_created', (p) => p?.data?.group?.guid === guid);

  expect(payload.trigger).toBe('group_created');
  expect(payload.data.group.guid).toBe(guid);
  expect(payload.data.group.name).toBe('QA Created Group');
  expect(payload.data.group.type).toBe('public');
  expect(payload.data.group.owner).toBe(OWNER);
  expect(payload.data.group.createdAt).toBe(created.createdAt);
});

test('group_updated webhook fires with the new name applied', async () => {
  const guid = uniqueGuid('qa-group-updated');
  await createGroup({ guid, name: 'Before Update', onBehalfOf: OWNER });
  await resetEvents();

  await updateGroup(guid, { name: 'After Update' }, OWNER);

  const payload = await expectWebhookEvent('group_updated', (p) => p?.data?.group?.guid === guid);

  expect(payload.trigger).toBe('group_updated');
  expect(payload.data.group.guid).toBe(guid);
  expect(payload.data.group.name).toBe('After Update');
  expect(payload.data.group.name).not.toBe('Before Update');
});

test('group_deleted webhook fires for the deleted guid', async () => {
  const guid = uniqueGuid('qa-group-deleted');
  await createGroup({ guid, name: 'To Be Deleted', onBehalfOf: OWNER });
  await resetEvents();

  await deleteGroup(guid, OWNER);

  const payload = await expectWebhookEvent('group_deleted', (p) => p?.data?.group?.guid === guid);

  expect(payload.trigger).toBe('group_deleted');
  expect(payload.data.group.guid).toBe(guid);
});

test('group_member_added webhook fires with correct member and actor', async () => {
  const guid = uniqueGuid('qa-group-add-member');
  await createGroup({ guid, name: 'Add Member Group', onBehalfOf: OWNER });
  await resetEvents();

  await addGroupMembers(guid, { participants: [MEMBER], onBehalfOf: OWNER });

  const payload = await expectWebhookEvent('group_member_added', (p) => p?.data?.group?.guid === guid);

  expect(payload.trigger).toBe('group_member_added');
  expect(payload.data.group.guid).toBe(guid);
  expect(payload.data.members).toHaveProperty(MEMBER);
  expect(payload.data.by.uid).toBe(OWNER);
});

test('group_member_kicked webhook fires with correct member and actor', async () => {
  const guid = uniqueGuid('qa-group-kick');
  await createGroup({ guid, name: 'Kick Group', onBehalfOf: OWNER });
  await addGroupMembers(guid, { participants: [MEMBER], onBehalfOf: OWNER });
  await resetEvents();

  await kickGroupMember(guid, MEMBER, OWNER);

  const payload = await expectWebhookEvent('group_member_kicked', (p) => p?.data?.group?.guid === guid);

  expect(payload.trigger).toBe('group_member_kicked');
  expect(payload.data.group.guid).toBe(guid);
  expect(payload.data.members).toHaveProperty(MEMBER);
  expect(payload.data.by.uid).toBe(OWNER);
});

test('group_member_banned webhook fires with correct member and actor', async () => {
  // KNOWN COMETCHAT BUG (confirmed 2026-09-01): when Ban Member is called
  // with an onBehalfOf header, the REST response correctly bans the target
  // (entities.on.entity.uid = target), but the group_member_banned webhook's
  // data.members incorrectly contains the *actor's* UID instead of the
  // target's — duplicating data.by. Reproduced consistently outside this
  // suite via direct fetch(), so it's not a test artifact. Tracked here as
  // an expected failure rather than silently weakened or skipped.
  test.fail(true, 'CometChat webhook bug: group_member_banned.data.members contains the actor, not the banned target, when onBehalfOf is used');

  const guid = uniqueGuid('qa-group-ban');
  await createGroup({ guid, name: 'Ban Group', onBehalfOf: OWNER });
  await addGroupMembers(guid, { participants: [MEMBER], onBehalfOf: OWNER });
  await resetEvents();

  await banGroupMember(guid, MEMBER, OWNER);

  const payload = await expectWebhookEvent('group_member_banned', (p) => p?.data?.group?.guid === guid);

  expect(payload.trigger).toBe('group_member_banned');
  expect(payload.data.group.guid).toBe(guid);
  expect(payload.data.members).toHaveProperty(MEMBER);
  expect(payload.data.by.uid).toBe(OWNER);
});

test('group_member_unbanned webhook fires with correct member and actor', async () => {
  // KNOWN COMETCHAT BUG (confirmed 2026-09-01): same defect as
  // group_member_banned above — data.members contains the actor's UID
  // instead of the unbanned target's when onBehalfOf is used.
  test.fail(true, 'CometChat webhook bug: group_member_unbanned.data.members contains the actor, not the unbanned target, when onBehalfOf is used');

  const guid = uniqueGuid('qa-group-unban');
  await createGroup({ guid, name: 'Unban Group', onBehalfOf: OWNER });
  await addGroupMembers(guid, { participants: [MEMBER], onBehalfOf: OWNER });
  await banGroupMember(guid, MEMBER, OWNER);
  await resetEvents();

  await unbanGroupMember(guid, MEMBER, OWNER);

  const payload = await expectWebhookEvent('group_member_unbanned', (p) => p?.data?.group?.guid === guid);

  expect(payload.trigger).toBe('group_member_unbanned');
  expect(payload.data.group.guid).toBe(guid);
  expect(payload.data.members).toHaveProperty(MEMBER);
  expect(payload.data.by.uid).toBe(OWNER);
});

test('group_member_scope_changed webhook fires with old and new scope', async () => {
  const guid = uniqueGuid('qa-group-scope');
  await createGroup({ guid, name: 'Scope Group', onBehalfOf: OWNER });
  await addGroupMembers(guid, { participants: [MEMBER], onBehalfOf: OWNER });
  await resetEvents();

  await changeMemberScope(guid, MEMBER, 'moderator', OWNER);

  const payload = await expectWebhookEvent('group_member_scope_changed', (p) => p?.data?.group?.guid === guid);

  expect(payload.trigger).toBe('group_member_scope_changed');
  expect(payload.data.group.guid).toBe(guid);
  expect(payload.data.members[MEMBER].scope).toBe('moderator');
  expect(payload.data.members[MEMBER].oldScope).toBe('participant');
  expect(payload.data.by.uid).toBe(OWNER);
});

test('group_owner_transferred webhook fires with correct old and new owner', async () => {
  const guid = uniqueGuid('qa-group-owner');
  await createGroup({ guid, name: 'Owner Group', onBehalfOf: OWNER });
  await addGroupMembers(guid, { participants: [MEMBER], onBehalfOf: OWNER });
  await resetEvents();

  // Deliberately no onBehalfOf here: CometChat's Update Group API docs state
  // the `owner` field is silently ignored whenever onBehalfOf is present on
  // the request — confirmed live (passing both fires group_updated instead
  // of group_owner_transferred, because the ownership change never happens).
  await transferGroupOwnership(guid, MEMBER);

  const payload = await expectWebhookEvent('group_owner_transferred', (p) => p?.data?.group?.guid === guid);

  expect(payload.trigger).toBe('group_owner_transferred');
  expect(payload.data.group.guid).toBe(guid);
  expect(payload.data.group.owner).toBe(MEMBER);
  expect(payload.data.group.oldOwner).toBe(OWNER);
});
