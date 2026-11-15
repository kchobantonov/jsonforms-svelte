import { setContext, getContext, onDestroy, tick } from 'svelte';
import { SvelteSet } from 'svelte/reactivity';
import { OwnedErrorStore, OwnedErrorsContextSymbol } from './ownedErrors';
import { withReactivePropsFrom } from './jsonFormsCompositions.svelte';
import {
  coreReducer,
  Resolve,
  UPDATE_DATA,
  update,
  type CoreActions,
  type JsonFormsCore,
} from '@jsonforms/core';
import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
import { useDispatch, useJsonForms, useTranslator } from './jsonFormsCompositions.svelte';
import { DispatchContextSymbol, JsonFormsContextSymbol } from './types';
import {
  InitialFocusDiagnostic,
  InitialFocusDiagnosticSymbol,
} from './initialFocusDiagnostic.svelte';
import { preventsEmpty } from './compositeActions.svelte';
import { useConfirmation } from './confirmation.svelte';
import { useRendererMessages } from './rendererMessages.svelte';
import type { DetailDialogProps } from './tuplePresentation';
import { CollectionIdentityContextSymbol, CollectionIdentityStore } from './collectionIdentity';
import { useUIDiagnosticReporter } from './authorDiagnostic.svelte';

const PendingDialogChanges = Symbol.for('jsonforms:pendingDialogChanges');
type PendingChange = { flush?: () => unknown; cancel?: () => void; isBlocked?: () => boolean };
let activeBlockTraversal: Set<PendingChange> | undefined;
let activeFlushTraversal: Set<PendingChange> | undefined;

function anyBlocked(changes: Iterable<PendingChange>) {
  const root = activeBlockTraversal === undefined;
  const visited = (activeBlockTraversal ??= new Set());
  try {
    for (const change of changes) {
      if (visited.has(change)) continue;
      visited.add(change);
      if (change.isBlocked?.()) return true;
    }
    return false;
  } finally {
    if (root) activeBlockTraversal = undefined;
  }
}

function flushChanges(changes: Iterable<PendingChange>) {
  const root = activeFlushTraversal === undefined;
  const visited = (activeFlushTraversal ??= new Set());
  try {
    for (const change of changes) {
      if (visited.has(change)) continue;
      visited.add(change);
      change.flush?.();
    }
  } finally {
    if (root) activeFlushTraversal = undefined;
  }
}

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
  let cancelPendingWait: (() => void) | undefined;
  onDestroy(() => {
    active = false;
    cancelPendingWait?.();
  });
  const pending = getContext<Set<PendingChange> | undefined>(PendingDialogChanges);
  const owned = getContext<OwnedErrorStore | undefined>(OwnedErrorsContextSymbol);
  const waitForOwnedValidation = async () => {
    if (!owned?.snapshot.pending) return true;
    return new Promise<boolean>((resolve) => {
      let settled = false;
      let unsubscribe = () => {};
      const finish = (ready: boolean) => {
        if (settled) return;
        settled = true;
        unsubscribe();
        if (cancelPendingWait === cancel) cancelPendingWait = undefined;
        resolve(ready);
      };
      const cancel = () => finish(false);
      cancelPendingWait = cancel;
      unsubscribe = owned.subscribe((snapshot) => {
        if (!snapshot.pending) finish(active);
      });
      if (settled) unsubscribe();
    });
  };
  return async (beforeFlush?: () => boolean, captureAfterFlush?: () => () => boolean) => {
    // Apply host replacements and permission changes before invoking queued writes.
    await tick();
    if (
      !active ||
      (beforeFlush && !beforeFlush()) ||
      anyBlocked(pending ?? []) ||
      !(await waitForOwnedValidation())
    )
      return false;
    if (!active || (beforeFlush && !beforeFlush()) || anyBlocked(pending ?? [])) return false;
    flushChanges(pending ?? []);
    // Host listeners and validation must see the flushed core state before the action.
    await tick();
    const afterFlush = captureAfterFlush?.();
    if (
      !active ||
      (afterFlush && !afterFlush()) ||
      anyBlocked(pending ?? []) ||
      !(await waitForOwnedValidation())
    )
      return false;
    return active && (!afterFlush || afterFlush()) && !anyBlocked(pending ?? []);
  };
}

/** Flush nested debounced inputs before an action reads their values. */
export function usePendingControlChanges() {
  const parent = getContext<Set<PendingChange> | undefined>(PendingDialogChanges);
  const pending = new SvelteSet<PendingChange>();
  const changes = {
    isBlocked: () => anyBlocked(pending),
    flush: () => flushChanges(pending),
    cancel: () => {
      for (const change of pending) change.cancel?.();
    },
  };
  // Collection pagination creates a nested scope for its row editors. Actions
  // inside it still need to honor sibling drafts in the enclosing form. Skip
  // this scope's own parent registration to avoid recursing through `changes`.
  if (parent) {
    pending.add({
      isBlocked: () => anyBlocked([...parent].filter((change) => change !== changes)),
      flush: () => flushChanges([...parent].filter((change) => change !== changes)),
    });
  }
  registerDetailDialogChange(changes);
  setContext(PendingDialogChanges, pending);
  onDestroy(changes.cancel);
  return changes;
}

/** Isolated full-form context preserves root references and rules while edits stay local. */
export function useDetailDialog(props: DetailDialogProps) {
  const reportDiagnostic = useUIDiagnosticReporter();
  setContext(InitialFocusDiagnosticSymbol, new InitialFocusDiagnostic(reportDiagnostic));
  const draftIdentity = new CollectionIdentityStore();
  setContext(CollectionIdentityContextSymbol, draftIdentity);
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
  const deletionConfirmation = useConfirmation();
  let draft = $state.raw<JsonFormsCore>();
  let active = $state(false);
  // Parent collection transitions must preserve an open isolated draft.
  registerDetailDialogChange({ isBlocked: () => active });
  setContext(PendingDialogChanges, pending);
  const prepareAction = usePendingControlAction();
  let original: unknown;
  let originalPath = props.path;
  let originalSchema = cloneDeep(props.schema);
  let session = 0;
  let applyingSession = $state<number | undefined>();
  const options = $derived({ ...parent.config, ...props.options });
  const dialogOptions = $derived(props.dialogOptions ?? props.options ?? {});
  const value = $derived(props.path ? Resolve.data(draft?.data, props.path) : draft?.data);
  const current = () =>
    props.path ? Resolve.data(parent.core?.data, props.path) : parent.core?.data;
  const targetCurrent = () =>
    props.path === originalPath &&
    isEqual(props.schema, originalSchema) &&
    isEqual(current(), original);
  const enabled = $derived(props.enabled && !parent.readonly);
  $effect(() => {
    if (deletionConfirmation.pending && (!active || !enabled || !targetCurrent()))
      deletionConfirmation.cancel();
  });
  const restricted = $derived(options.restrict !== false);
  const canEmpty = $derived(
    active &&
      enabled &&
      targetCurrent() &&
      !options.disableRemove &&
      value != null &&
      typeof value === 'object' &&
      Object.keys(value).length > 0 &&
      (!restricted || !preventsEmpty(props.schema, Array.isArray(value))),
  );
  const canRemove = $derived(
    active &&
      enabled &&
      targetCurrent() &&
      props.allowRemove === true &&
      value !== undefined &&
      !options.disableRemove,
  );
  const draftContext = withReactivePropsFrom(() => draft ?? parent.core!, {
    get additionalErrors() {
      return [...(draft?.additionalErrors ?? []), ...ownedSnapshot.errors];
    },
  });
  const blocked = () =>
    ownedSnapshot.pending || ownedSnapshot.errors.length > 0 || anyBlocked(pending);
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
    const next = coreReducer(draft, action);
    draftIdentity.update(draft.data, next.data, action);
    draft = next;
  }
  setContext(DispatchContextSymbol, localDispatch);
  function cancel() {
    session++;
    deletionConfirmation.cancel();
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
    get pendingDeletion() {
      return deletionConfirmation.pending;
    },
    acceptDeletion() {
      deletionConfirmation.accept();
    },
    cancelDeletion() {
      deletionConfirmation.cancel();
    },
    get showEmpty() {
      return dialogOptions.showEmptyButton === true;
    },
    get showRemove() {
      return dialogOptions.showRemoveButton === true && props.allowRemove === true;
    },
    get canApply() {
      return (
        enabled &&
        active &&
        applyingSession !== session &&
        !deletionConfirmation.pending &&
        !blocked() &&
        targetCurrent()
      );
    },
    get conflict() {
      return active && !targetCurrent();
    },
    label(option: string, key: string, fallback?: string) {
      const custom = dialogOptions[option];
      if (typeof custom === 'string') return t.value(custom, custom);
      const translated = message(key);
      return translated === key && fallback !== undefined ? t.value(key, fallback) : translated;
    },
    begin() {
      session++;
      originalPath = props.path;
      originalSchema = cloneDeep(props.schema);
      original = cloneDeep(current());
      draft = { ...parent.core!, data: cloneDeep(parent.core?.data) };
      active = true;
    },
    cancel,
    async apply() {
      if (!active || !enabled || deletionConfirmation.pending || applyingSession === session)
        return false;
      const requestedSession = session;
      applyingSession = requestedSession;
      const stillCurrent = () =>
        active &&
        enabled &&
        session === requestedSession &&
        !deletionConfirmation.pending &&
        targetCurrent();
      try {
        if (!(await prepareAction(stillCurrent, () => stillCurrent))) return false;
        if (!stillCurrent() || blocked()) return false;
        const next = cloneDeep(value);
        const changed = !isEqual(original, next);
        cancel();
        if (changed) dispatch(update(originalPath, () => next));
        return true;
      } finally {
        if (applyingSession === requestedSession) applyingSession = undefined;
      }
    },
    empty() {
      if (!canEmpty || deletionConfirmation.pending) return;
      for (const change of pending) change.cancel?.();
      const previous = cloneDeep(value);
      const perform = () => {
        if (active && canEmpty && targetCurrent() && isEqual(value, previous))
          localDispatch(update(originalPath, () => (Array.isArray(previous) ? [] : {})));
      };
      if (props.confirmationCatalogId)
        deletionConfirmation.request({
          catalogId: props.confirmationCatalogId,
          operation: 'delete',
          options: props.dialogOptions ?? props.options,
          config: parent.config,
          discarded: [previous],
          perform,
        });
      else perform();
    },
    remove() {
      if (!canRemove || deletionConfirmation.pending) return;
      for (const change of pending) change.cancel?.();
      const previous = cloneDeep(value);
      const perform = () => {
        if (active && canRemove && targetCurrent() && isEqual(value, previous))
          localDispatch(update(originalPath, () => undefined));
      };
      if (props.confirmationCatalogId)
        deletionConfirmation.request({
          catalogId: props.confirmationCatalogId,
          operation: 'delete',
          options: props.dialogOptions ?? props.options,
          config: parent.config,
          discarded: [previous],
          perform,
        });
      else perform();
    },
  };
}
