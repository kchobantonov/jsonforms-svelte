import { useRendererMessages } from '../locale/rendererMessages.svelte';
import type { ConfirmationOperation } from './confirmation';
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

export interface ConfirmationDialogProps {
  operation: ConfirmationOperation;
  title?: string;
  description?: string;
  acceptLabel?: string;
  onAccept(): void;
  onCancel(): void;
}

export function useConfirmationLabels(props: ConfirmationDialogProps) {
  const message = useRendererMessages();
  return {
    get title() {
      return props.title ?? message('confirm.' + props.operation + '.title');
    },
    get description() {
      return props.description ?? message('confirm.' + props.operation + '.message');
    },
    get accept() {
      return props.acceptLabel ?? message('confirm.accept');
    },
    get decline() {
      return message('confirm.decline');
    },
    get close() {
      return message('dialog.close');
    },
  };
}
