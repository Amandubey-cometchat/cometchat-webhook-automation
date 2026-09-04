/**
 * No Campaigns/Notifications module integration exists in this project, and
 * it's unconfirmed whether that module is even enabled on any of the 4
 * CometChat apps this suite targets. See src/registry/campaign.registry.ts
 * for the full per-webhook BLOCKED reasoning.
 */

export class CampaignsClientNotImplementedError extends Error {
  constructor(action: string) {
    super(
      `campaigns.client.ts: "${action}" is not implemented — no Campaigns module integration exists in this project.`
    );
  }
}

export async function createCampaign(..._args: unknown[]): Promise<never> {
  throw new CampaignsClientNotImplementedError('createCampaign');
}

export async function sendFeedItem(..._args: unknown[]): Promise<never> {
  throw new CampaignsClientNotImplementedError('sendFeedItem');
}

export async function sendPushNotification(..._args: unknown[]): Promise<never> {
  throw new CampaignsClientNotImplementedError('sendPushNotification');
}
