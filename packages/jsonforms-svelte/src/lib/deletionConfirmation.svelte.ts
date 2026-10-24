import { tick } from 'svelte';
import { usePendingControlAction } from './detailDialog.svelte';
import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
import type { ConfirmationCatalogId } from './confirmation';
import { useConfirmation } from './confirmation.svelte';

interface DeletionTarget {
  data: unknown;
  schema?: unknown;
  arraySchema?: unknown;
  rootSchema?: unknown;
  path: string;
  enabled: boolean;
  readonly?: boolean;
  visible?: boolean;
  options?: Record<string, unknown>;
  config?: unknown;
}

/** Native dialogs are supplied by each renderer family. Capture the owner and
 * collection after pending edits flush; recheck both when the user accepts. */
export function useDeletionConfirmation(
  target: () => DeletionTarget,
  catalogId: ConfirmationCatalogId,
  prepare: () => boolean,
) {
  const confirmation = useConfirmation();
  const prepareAction = usePendingControlAction();
  let preparing = false;
  let validTarget = $state.raw<(() => boolean) | undefined>();
  const identity = () => {
    const current = target();
    return cloneDeep([current.path, current.schema, current.arraySchema, current.rootSchema]);
  };
  $effect(() => {
    if (confirmation.pending && validTarget && !validTarget()) confirmation.cancel();
  });
  const available = () => {
    const current = target();
    return current.enabled && !current.readonly && current.visible !== false;
  };
  return {
    get pending() {
      return confirmation.pending;
    },
    get accept() {
      const expected = confirmation.pending;
      return () => {
        if (expected) confirmation.accept(expected);
      };
    },
    get cancel() {
      const expected = confirmation.pending;
      return () => {
        if (expected) confirmation.cancel(expected);
      };
    },
    async request(discarded: () => unknown[], perform: () => void, allowed: () => boolean) {
      if (preparing || confirmation.pending || !available() || !allowed()) return;
      preparing = true;
      const owner = identity();
      const sameOwner = () => available() && isEqual(identity(), owner);
      try {
        if (!(await prepareAction()) || !sameOwner() || !prepare()) return;
        await tick();
        if (!sameOwner() || !allowed()) return;
        const current = target();
        const snapshot = cloneDeep(current.data);
        const valid = () => sameOwner() && allowed() && isEqual(target().data, snapshot);
        validTarget = valid;
        confirmation.request({
          catalogId,
          operation: 'delete',
          options: current.options,
          config: current.config,
          discarded: discarded(),
          async perform() {
            if (!valid() || !(await prepareAction()) || !prepare()) return;
            await tick();
            if (valid()) perform();
          },
        });
      } finally {
        preparing = false;
      }
    },
  };
}
