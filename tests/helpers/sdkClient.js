/**
 * A real, connected CometChat client — for the handful of triggers that only
 * fire from the SDK's client-side WebSocket session (group self-join/leave,
 * delivery/read receipts, connection status), which the REST API this
 * project otherwise uses has no way to reach (verified live: REST 'Add
 * Members' with onBehalfOf set to the joining user's own UID 401s with
 * ERR_GROUP_NOT_JOINED; the REST Messages API has no mark-as-delivered/read
 * endpoint at all).
 *
 * Drives the actual CometChat JS SDK inside a real (headless) browser via
 * Playwright, loaded from the CDN CometChat's own docs point to — not a
 * mock, not a simulation. Requires an Auth Token (createAuthToken), not the
 * server-side REST API key, per CometChat's client-auth model.
 */
const { chromium } = require('@playwright/test');

const COMETCHAT_SDK_CDN = 'https://unpkg.com/@cometchat/chat-sdk-javascript/CometChat.js';

async function launchSdkClient(uid, authToken) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  // The SDK requires a real origin with localStorage available — a blank/
  // about: page has no storage backend and init() fails with
  // "No available storage method found". Verified live.
  await page.goto('https://example.com');
  await page.addScriptTag({ url: COMETCHAT_SDK_CDN });

  const { COMETCHAT_APP_ID, COMETCHAT_REGION } = process.env;
  await page.evaluate(
    async ({ appId, region, authToken }) => {
      const appSetting = new CometChat.AppSettingsBuilder()
        .subscribePresenceForAllUsers()
        .setRegion(region)
        .autoEstablishSocketConnection(true)
        .build();
      await CometChat.init(appId, appSetting);
      await CometChat.login(authToken);
    },
    { appId: COMETCHAT_APP_ID, region: COMETCHAT_REGION, authToken }
  );
  // login() resolving doesn't guarantee the WebSocket has finished opening —
  // calling an action too soon throws NO_WEBSOCKET_CONNECTION. Verified live.
  await new Promise((resolve) => setTimeout(resolve, 3000));

  return {
    uid,
    page,
    async joinGroup(guid) {
      return page.evaluate(
        ({ guid }) => CometChat.joinGroup(guid, CometChat.GROUP_TYPE.PUBLIC, '').then((g) => ({ hasJoined: g.getHasJoined() })),
        { guid }
      );
    },
    async leaveGroup(guid) {
      return page.evaluate(({ guid }) => CometChat.leaveGroup(guid).then((hasLeft) => ({ hasLeft })), { guid });
    },
    async markAsDelivered(messageId, receiverId, receiverType, senderId) {
      return page.evaluate(
        ({ messageId, receiverId, receiverType, senderId }) =>
          CometChat.markAsDelivered(String(messageId), receiverId, receiverType, senderId),
        { messageId, receiverId, receiverType, senderId }
      );
    },
    async markAsRead(messageId, receiverId, receiverType, senderId) {
      return page.evaluate(
        ({ messageId, receiverId, receiverType, senderId }) =>
          CometChat.markAsRead(String(messageId), receiverId, receiverType, senderId),
        { messageId, receiverId, receiverType, senderId }
      );
    },
    async disconnect() {
      await page.evaluate(() => CometChat.logout());
    },
    async close() {
      await browser.close();
    },
  };
}

module.exports = { launchSdkClient };
