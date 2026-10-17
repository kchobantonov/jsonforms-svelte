import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
import type { ConfirmationCatalogId } from './confirmation';
import { useConfirmation } from './confirmation.svelte';

interface DeletionTarget {
  data: unknown;
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
  const available = () => {
    const current = target();
    return current.enabled && !current.readonly && current.visible !== false;
  };
  return {
    get pending() {
      return confirmation.pending;
    },
    accept: () => confirmation.accept(),
    cancel: () => confirmation.cancel(),
    request(discarded: () => unknown[], perform: () => void, allowed: () => boolean) {
      if (!available() || !prepare() || !allowed()) return;
      const current = target();
      const path = current.path;
      const snapshot = cloneDeep(current.data);
      confirmation.request({
        catalogId,
        operation: 'delete',
        options: current.options,
        config: current.config,
        discarded: discarded(),
        perform() {
          if (!available() || !prepare() || !allowed()) return;
          const next = target();
          if (next.path !== path || !isEqual(next.data, snapshot)) return;
          perform();
        },
      });
    },
  };
}
