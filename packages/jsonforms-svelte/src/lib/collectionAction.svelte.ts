import { onDestroy, tick } from 'svelte';
import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
import { usePendingControlAction } from './detailDialog.svelte';

interface CollectionActionTarget {
  path: string;
  schema?: unknown;
  arraySchema?: unknown;
  rootSchema?: unknown;
  enabled: boolean;
  readonly?: boolean;
  visible?: boolean;
}

/** Resolve drafts before a collection command, then recheck its owner and limits. */
export function useCollectionAction(target: () => CollectionActionTarget, prepare: () => boolean) {
  const prepareAction = usePendingControlAction();
  let mounted = true;
  onDestroy(() => {
    mounted = false;
  });
  let active = false;
  const identity = () => {
    const current = target();
    return [current.path, current.schema, current.arraySchema, current.rootSchema];
  };
  const available = () => {
    const current = target();
    return mounted && current.enabled && !current.readonly && current.visible !== false;
  };
  return async (allowed: () => boolean, perform: () => void) => {
    if (active || !available() || !allowed()) return;
    active = true;
    const owner = cloneDeep(identity());
    const current = () => available() && isEqual(identity(), owner);
    try {
      if (!(await prepareAction()) || !current() || !prepare()) return;
      await tick();
      if (current() && allowed()) perform();
    } finally {
      active = false;
    }
  };
}
