import { setContext, getContext, onDestroy } from 'svelte';
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
import type { DetailDialogProps } from './tuplePresentation';

const PendingDialogChanges = Symbol.for('jsonforms:pendingDialogChanges');
type PendingChange = { flush?: () => unknown; cancel?: () => void };
export function registerDetailDialogChange(change: PendingChange) {
  const pending = getContext<Set<PendingChange> | undefined>(PendingDialogChanges);
  if (!pending || !change.flush) return;
  pending.add(change);
  onDestroy(() => {
    change.cancel?.();
    pending.delete(change);
  });
}

/** Flush nested debounced inputs before an action reads their values. */
export function usePendingControlChanges() {
  const pending = new Set<PendingChange>();
  const changes = {
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
  const pending = new Set<PendingChange>();
  setContext(PendingDialogChanges, pending);
  const dispatch = useDispatch();
  const t = useTranslator();
  let draft = $state.raw<JsonFormsCore>();
  let active = $state(false);
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
  setContext(JsonFormsContextSymbol, {
    get core() {
      return active ? draft : parent.core;
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
      return enabled && active && isEqual(current(), original);
    },
    label(option: string, key: string, fallback: string) {
      const custom = options[option];
      return typeof custom === 'string' ? t.value(custom, custom) : t.value(key, fallback);
    },
    begin() {
      original = cloneDeep(current());
      draft = { ...parent.core!, data: cloneDeep(parent.core?.data) };
      active = true;
    },
    cancel,
    apply() {
      if (active && enabled) for (const change of pending) change.flush?.();
      if (!enabled || !active || !isEqual(current(), original)) return false;
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
