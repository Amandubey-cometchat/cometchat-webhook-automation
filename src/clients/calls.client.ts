/**
 * No Calls SDK integration exists in this project, and it's unconfirmed
 * whether the Calls & Meeting add-on is even enabled on any of the 4
 * CometChat apps this suite targets (staging-us, prod-us, prod-eu, prod-in).
 * These stubs exist so the file this architecture expects is present and the
 * error message when someone reaches for it is immediate and actionable,
 * rather than a missing-module import failure. See src/registry/calls.registry.ts
 * for the full per-webhook BLOCKED reasoning.
 */

export class CallsClientNotImplementedError extends Error {
  constructor(action: string) {
    super(
      `calls.client.ts: "${action}" is not implemented — no Calls SDK integration exists in this project. ` +
        'Needs: confirmation the Calls & Meeting add-on is enabled on the target app, and a real Calls SDK ' +
        'client (analogous to src/clients/sdk.client.ts\'s approach for chat).'
    );
  }
}

export async function initiateCall(..._args: unknown[]): Promise<never> {
  throw new CallsClientNotImplementedError('initiateCall');
}

export async function answerCall(..._args: unknown[]): Promise<never> {
  throw new CallsClientNotImplementedError('answerCall');
}

export async function endCall(..._args: unknown[]): Promise<never> {
  throw new CallsClientNotImplementedError('endCall');
}
