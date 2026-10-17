import { setContext, getContext, onDestroy, tick } from 'svelte';
import { SvelteSet } from 'svelte/reactivity';
import { OwnedErrorStore, OwnedErrorsContextSymbol } from './ownedErrors';
import { withReactivePropsFrom } from './jsonFormsCompositions.svelte';
import {
  coreReducer,
  UPDATE_DATA,
  update,
  type CoreActions,
  type JsonFormsCore,
} from '@jsonforms/core';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import { useDispatch, useJsonForms, useTranslator } from './jsonFormsCompositions.svelte';
import { DispatchContextSymbol, JsonFormsContextSymbol } from './types';
import { preventsEmpty } from './compositeActions.svelte';
import { useRendererMessages } from './rendererMessages.svelte';
import type { DetailDialogProps } from './tuplePresentation';

const PendingDialogChanges = Symbol.for('jsonforms:pendingDialogChanges');
type PendingChange = { flush?: () => unknown; cancel?: () => void; isBlocked?: () => boolean };
export function registerDetailDialogChange(change: PendingChange) {
  const pending = getContext<Set<PendingChange> | undefined>(PendingDialogChanges);
  if (!pending || (!change.flush && !change.isBlocked)) return;
  pending.add(change);
  onDestroy(() => {
    change.cancel?.();
    pending.delete(change);
  });
}

/** Resolve the nearest form/editor scope before an action consumes its data. */
export function usePendingControlAction() {
  let active = true;
  onDestroy(() => {
    active = false;
  });
  const pending = getContext<Set<PendingChange> | undefined>(PendingDialogChanges);
  const owned = getContext<OwnedErrorStore | undefined>(OwnedErrorsContextSymbol);
  const blocked = () =>
    owned?.snapshot.pending || [...(pending ?? [])].some((change) => change.isBlocked?.());
  return async () => {
    // Apply host replacements and permission changes before invoking queued writes.
    await tick();
    if (!active || blocked()) return false;
    for (const change of pending ?? []) change.flush?.();
    // Host listeners and validation must see the flushed core state before the action.
    await tick();
    return active && !blocked();
  };
}

/** Flush nested debounced inputs before an action reads their values. */
export function usePendingControlChanges() {
  const pending = new SvelteSet<PendingChange>();
  const changes = {
    isBlocked: () => [...pending].some((change) => change.isBlocked?.()),
    flush: () => {
      for (const change of pending) change.flush?.();
    },
    cancel: () => {
      for (const change of pending) change.cancel?.();
    },
  };
  registerDetailDialogChange(changes);
  setContext(PendingDialogChanges, pending);
  onDestroy(changes.cancel);
  return changes;
}

/** Isolated full-form context preserves root references and rules while edits stay local. */
export function useDetailDialog(props: DetailDialogProps) {
  const parent = useJsonForms();
  const pending = new SvelteSet<PendingChange>();
  const ownedErrors = new OwnedErrorStore();
  let ownedSnapshot = $state.raw(ownedErrors.snapshot);
  const unsubscribe = ownedErrors.subscribe((snapshot) => {
    ownedSnapshot = snapshot;
  });
  setContext(OwnedErrorsContextSymbol, ownedErrors);
  onDestroy(() => {
    unsubscribe();
    ownedErrors.dispose();
  });
  const dispatch = useDispatch();
  const t = useTranslator();
  const message = useRendererMessages();
  let draft = $state.raw<JsonFormsCore>();
  let active = $state(false);
  // Parent collection transitions must preserve an open isolated draft.
  registerDetailDialogChange({ isBlocked: () => active });
  setContext(PendingDialogChanges, pending);
  let original: unknown;
  const options = $derived({ ...parent.config, ...props.options });
  const value = $derived(props.path ? get(draft?.data, props.path.split('.')) : draft?.data);
  const current = () =>
    props.path ? get(parent.core?.data, props.path.split('.')) : parent.core?.data;
  const enabled = $derived(props.enabled && !parent.readonly);
  const restricted = $derived(options.restrict !== false);
  const canEmpty = $derived(
    enabled &&
      !options.disableRemove &&
      value != null &&
      typeof value === 'object' &&
      Object.keys(value).length > 0 &&
      (!restricted || !preventsEmpty(props.schema, Array.isArray(value))),
  );
  const canRemove = $derived(
    enabled && props.allowRemove === true && value !== undefined && !options.disableRemove,
  );
  const draftContext = withReactivePropsFrom(() => draft ?? parent.core!, {
    get additionalErrors() {
      return [...(draft?.additionalErrors ?? []), ...ownedSnapshot.errors];
    },
  });
  const blocked = () =>
    ownedSnapshot.pending ||
    ownedSnapshot.errors.length > 0 ||
    [...pending].some((change) => change.isBlocked?.());
  setContext(JsonFormsContextSymbol, {
    get core() {
      return active ? draftContext : parent.core;
    },
    get config() {
      return parent.config;
    },
    get i18n() {
      return parent.i18n;
    },
    get renderers() {
      return parent.renderers;
    },
    get cells() {
      return parent.cells;
    },
    get uischemas() {
      return parent.uischemas;
    },
    get readonly() {
      return parent.readonly;
    },
  });
  function localDispatch(action: CoreActions) {
    if (!active || !enabled || !draft) return;
    if (action.type !== UPDATE_DATA) return;
    if (props.path && action.path !== props.path && !action.path.startsWith(props.path + '.'))
      return;
    draft = coreReducer(draft, action);
  }
  setContext(DispatchContextSymbol, localDispatch);
  function cancel() {
    for (const change of pending) change.cancel?.();
    ownedErrors.clear();
    active = false;
    draft = undefined;
  }
  return {
    get active() {
      return active;
    },
    get canEmpty() {
      return canEmpty;
    },
    get canRemove() {
      return canRemove;
    },
    get showEmpty() {
      return options.showEmptyButton === true;
    },
    get showRemove() {
      return options.showRemoveButton === true && props.allowRemove === true;
    },
    get canApply() {
      return enabled && active && !blocked() && isEqual(current(), original);
    },
    label(option: string, key: string, fallback?: string) {
      const custom = options[option];
      if (typeof custom === 'string') return t.value(custom, custom);
      const translated = message(key);
      return translated === key && fallback !== undefined ? t.value(key, fallback) : translated;
    },
    begin() {
      original = cloneDeep(current());
      draft = { ...parent.core!, data: cloneDeep(parent.core?.data) };
      active = true;
    },
    cancel,
    apply() {
      if (active && enabled) for (const change of pending) change.flush?.();
      if (!enabled || !active || blocked() || !isEqual(current(), original)) return false;
      const next = cloneDeep(value);
      const changed = !isEqual(original, next);
      cancel();
      if (changed) dispatch(update(props.path, () => next));
      return true;
    },
    empty() {
      if (!canEmpty) return;
      for (const change of pending) change.cancel?.();
      localDispatch(update(props.path, () => (Array.isArray(value) ? [] : {})));
    },
    remove() {
      if (!canRemove) return;
      for (const change of pending) change.cancel?.();
      localDispatch(update(props.path, () => undefined));
    },
  };
}
