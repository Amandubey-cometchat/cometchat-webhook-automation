/**
 * Thin wrapper around CometChat's REST API — this is the "trigger side" of
 * the tests. Calling these functions causes CometChat to fire webhooks,
 * without needing the UI at all (fast + reliable).
 *
 * Full REST API reference: https://api-explorer.cometchat.com
 */
require('dotenv').config();

const { COMETCHAT_APP_ID, COMETCHAT_REGION, COMETCHAT_REST_API_KEY } = process.env;

// Fail fast with a clear message rather than letting every test time out
// against a malformed https://undefined.api-undefined.cometchat.io/v3 host.
for (const [name, value] of Object.entries({ COMETCHAT_APP_ID, COMETCHAT_REGION, COMETCHAT_REST_API_KEY })) {
  if (!value) {
    throw new Error(
      `Missing required env var ${name}. Set it in the project root .env before running tests — see .env.example.`
    );
  }
}

const BASE_URL = `https://${COMETCHAT_APP_ID}.api-${COMETCHAT_REGION}.cometchat.io/v3`;

const headers = {
  appId: COMETCHAT_APP_ID,
  apiKey: COMETCHAT_REST_API_KEY,
  'Content-Type': 'application/json',
};

async function apiRequest(method, path, body, extraHeaders) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: extraHeaders ? { ...headers, ...extraHeaders } : headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${method} ${path} failed: ${res.status} ${JSON.stringify(json)}`);
  }
  return json.data;
}

async function createTestUser(uid, name) {
  return apiRequest('POST', '/users', { uid, name });
}

async function sendTextMessage({ sender, receiver, receiverType = 'user', text }) {
  // onBehalfOf makes CometChat attribute the message to the real sender UID
  // instead of the app_system service account — verified live: without it,
  // payload.data.message.sender comes back as "app_system" regardless of
  // who you pass as `receiver`/`sender` in the body.
  return apiRequest(
    'POST',
    '/messages',
    { category: 'message', type: 'text', data: { text }, receiver, receiverType },
    sender ? { onBehalfOf: sender } : undefined
  );
}

async function editMessage(messageId, text, onBehalfOf) {
  return apiRequest('PUT', `/messages/${messageId}`, { data: { text } }, onBehalfOf ? { onBehalfOf } : undefined);
}

async function deleteMessage(messageId, onBehalfOf) {
  return apiRequest('DELETE', `/messages/${messageId}`, undefined, onBehalfOf ? { onBehalfOf } : undefined);
}

async function addReaction(messageId, reaction, onBehalfOf) {
  return apiRequest('POST', `/messages/${messageId}/reactions/${encodeURIComponent(reaction)}`, undefined, {
    onBehalfOf,
  });
}

async function removeReaction(messageId, reaction, onBehalfOf) {
  return apiRequest('DELETE', `/messages/${messageId}/reactions/${encodeURIComponent(reaction)}`, undefined, {
    onBehalfOf,
  });
}

async function blockUser(uid, blockedUid) {
  return apiRequest('POST', `/users/${uid}/blockedusers`, { blockedUids: [blockedUid] });
}

async function unblockUser(uid, blockedUid) {
  return apiRequest('DELETE', `/users/${uid}/blockedusers`, { blockedUids: [blockedUid] });
}

async function createGroup({ guid, name, type = 'public', onBehalfOf }) {
  return apiRequest('POST', '/groups', { guid, name, type }, onBehalfOf ? { onBehalfOf } : undefined);
}

async function updateGroup(guid, updates, onBehalfOf) {
  return apiRequest('PUT', `/groups/${guid}`, updates, onBehalfOf ? { onBehalfOf } : undefined);
}

async function deleteGroup(guid, onBehalfOf) {
  return apiRequest('DELETE', `/groups/${guid}`, undefined, onBehalfOf ? { onBehalfOf } : undefined);
}

async function addGroupMembers(guid, { admins, moderators, participants, onBehalfOf } = {}) {
  const body = {};
  if (admins) body.admins = admins;
  if (moderators) body.moderators = moderators;
  if (participants) body.participants = participants;
  return apiRequest('POST', `/groups/${guid}/members`, body, onBehalfOf ? { onBehalfOf } : undefined);
}

async function kickGroupMember(guid, uid, onBehalfOf) {
  return apiRequest('DELETE', `/groups/${guid}/members/${uid}`, undefined, onBehalfOf ? { onBehalfOf } : undefined);
}

async function changeMemberScope(guid, uid, scope, onBehalfOf) {
  return apiRequest('PUT', `/groups/${guid}/members/${uid}`, { scope }, onBehalfOf ? { onBehalfOf } : undefined);
}

async function transferGroupOwnership(guid, newOwnerUid, onBehalfOf) {
  return apiRequest('PUT', `/groups/${guid}`, { owner: newOwnerUid }, onBehalfOf ? { onBehalfOf } : undefined);
}

async function banGroupMember(guid, uid, onBehalfOf) {
  return apiRequest('POST', `/groups/${guid}/bannedusers/${uid}`, undefined, onBehalfOf ? { onBehalfOf } : undefined);
}

async function unbanGroupMember(guid, uid, onBehalfOf) {
  return apiRequest('DELETE', `/groups/${guid}/bannedusers/${uid}`, undefined, onBehalfOf ? { onBehalfOf } : undefined);
}

async function getGroup(guid) {
  return apiRequest('GET', `/groups/${guid}`);
}

module.exports = {
  createTestUser,
  sendTextMessage,
  editMessage,
  deleteMessage,
  addReaction,
  removeReaction,
  blockUser,
  unblockUser,
  createGroup,
  updateGroup,
  deleteGroup,
  addGroupMembers,
  kickGroupMember,
  changeMemberScope,
  transferGroupOwnership,
  banGroupMember,
  unbanGroupMember,
  getGroup,
};
