import { shouldConfirm, type ResolveConfirmationOptions } from './confirmation';

export interface ConfirmationRequest extends ResolveConfirmationOptions {
  discarded: unknown[];
  /** Recheck current permissions and target identity before changing data. */
  perform: () => void;
}

/** Close synchronously before committing, so repeated activation cannot apply twice. */
export function useConfirmation() {
  let pending = $state.raw<ConfirmationRequest>();
  return {
    get pending() {
      return pending;
    },
    request(request: ConfirmationRequest) {
      if (shouldConfirm(request, request.discarded)) pending = request;
      else {
        pending = undefined;
        request.perform();
      }
    },
    cancel(expected = pending) {
      if (pending !== expected) return;
      pending = undefined;
    },
    accept(expected = pending) {
      if (pending !== expected) return;
      const request = pending;
      pending = undefined;
      request?.perform();
    },
  };
}
