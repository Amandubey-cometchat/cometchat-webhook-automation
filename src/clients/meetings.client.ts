/**
 * See calls.client.ts — same situation: no Calls & Meeting SDK integration
 * exists, and the add-on's availability on any target app is unconfirmed.
 */

export class MeetingsClientNotImplementedError extends Error {
  constructor(action: string) {
    super(
      `meetings.client.ts: "${action}" is not implemented — no Calls & Meeting SDK integration exists in ` +
        'this project. See src/registry/meetings.registry.ts for the full per-webhook BLOCKED reasoning.'
    );
  }
}

export async function startMeeting(..._args: unknown[]): Promise<never> {
  throw new MeetingsClientNotImplementedError('startMeeting');
}

export async function joinMeeting(..._args: unknown[]): Promise<never> {
  throw new MeetingsClientNotImplementedError('joinMeeting');
}

export async function endMeeting(..._args: unknown[]): Promise<never> {
  throw new MeetingsClientNotImplementedError('endMeeting');
}
