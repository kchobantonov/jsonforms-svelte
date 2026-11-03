import {
  dataPathToPointer,
  useCollectionItemIdentity,
  useUIDiagnosticReporter,
} from '@chobantonov/jsonforms-svelte';
import { onDestroy, tick, untrack } from 'svelte';
import type { JsonSchema, Translator } from '@jsonforms/core';
import { useOwnedErrors, registerDetailDialogChange } from '@chobantonov/jsonforms-svelte';
import { fromMonacoEditorValue, toMonacoEditorValue } from './monaco';
import { translateEditorMessage } from './editorMessages';
import { supportsMonacoDiagnosticReader } from './monacoDiagnosticSupport';

interface MonacoDraftBinding {
  readonly value: unknown;
  readonly schema: JsonSchema;
  readonly path: string;
  readonly pathSegments?: readonly string[];
  readonly language: string;
  readonly convertJson: boolean;
  readonly enabled: boolean;
  readonly propagateErrors: boolean;
  readonly diagnostics?: boolean;
  readonly validateJsonSchema?: boolean;
  readonly locale: string | undefined;
  readonly translate: Translator | undefined;
  onChange(value: unknown): void;
}

/** Keeps an editable JSON draft independently of the last successfully parsed value. */
export function useMonacoDraft(binding: MonacoDraftBinding) {
  const reportDiagnostic = useUIDiagnosticReporter();
  const tracksDiagnostics = () =>
    !!binding.diagnostics && supportsMonacoDiagnosticReader(binding.language);
  const owner = useOwnedErrors()?.createOwner();
  const item = useCollectionItemIdentity();
  const itemTarget = $derived.by(() => {
    if (!item) return undefined;
    const path = binding.path;
    if (path !== item.path && !path.startsWith(item.path + '.')) return undefined;
    return JSON.stringify([item.key, path.slice(item.path.length)]);
  });
  let lastItemTarget = untrack(() => itemTarget);
  let mounted = true;
  let reconciliation = 0;
  onDestroy(() => {
    mounted = false;
    reconciliation += 1;
    owner?.dispose();
  });
  let text = $state(
    untrack(() => toMonacoEditorValue(binding.value, binding.language, binding.convertJson)),
  );
  let invalid = $state(false);
  let subject = $state(0);
  let reconciling = $state(false);
  let diagnosticsPending = $state(untrack(tracksDiagnostics));
  let diagnosticFailure = $state(false);
  let lastDiagnostics = untrack(tracksDiagnostics);
  let errorCount = $state(0);
  // Invalid user drafts block actions. Reconciliation and published diagnostics
  // use the form-owned pending state, which the action coordinator waits for.
  registerDetailDialogChange({ isBlocked: () => invalid });
  let lastExternal = untrack(() => text);
  let lastCommitted: string | undefined;
  let lastCommittedValue: unknown;
  let lastValue = untrack(() => binding.value);
  let lastPath = untrack(() => binding.path);
  let lastLanguage = untrack(() => binding.language);
  let lastConvert = untrack(() => binding.convertJson);
  let lastSchema = untrack(() => JSON.stringify(binding.schema));
  let published: string | undefined;
  let warnedMissingStorePath: string | undefined;

  $effect(() => {
    const enabled = tracksDiagnostics();
    if (enabled !== lastDiagnostics) {
      lastDiagnostics = enabled;
      diagnosticsPending = enabled;
      diagnosticFailure = false;
    }
  });
  $effect(() => {
    const value = binding.value;
    const nextItemTarget = itemTarget;
    const path = binding.path;
    const language = binding.language;
    const convertJson = binding.convertJson;
    const encoded = toMonacoEditorValue(value, language, convertJson);
    const schemaKey = JSON.stringify(binding.schema);
    untrack(() => {
      if (
        Object.is(value, lastValue) &&
        encoded === lastExternal &&
        path === lastPath &&
        language === lastLanguage &&
        convertJson === lastConvert &&
        schemaKey === lastSchema &&
        nextItemTarget === lastItemTarget
      ) {
        reconciliation += 1;
        reconciling = false;
        return;
      }
      const version = ++reconciliation;
      reconciling = true;
      // Host data and UI-schema changes can reach bindings in separate effects.
      // Reconcile the settled target, not an intermediate old-row/new-path pair.
      void tick().then(() => {
        if (!mounted || version !== reconciliation) return;
        const configurationChanged =
          language !== lastLanguage || convertJson !== lastConvert || schemaKey !== lastSchema;
        const retainedCollectionSubject =
          nextItemTarget !== undefined &&
          nextItemTarget === lastItemTarget &&
          encoded === lastExternal &&
          !configurationChanged;
        const movedSameSubject =
          path !== lastPath &&
          encoded === lastExternal &&
          !configurationChanged &&
          (retainedCollectionSubject ||
            (value !== null && typeof value === 'object' && Object.is(value, lastValue)));
        const targetChanged =
          configurationChanged ||
          nextItemTarget !== lastItemTarget ||
          (path !== lastPath && !movedSameSubject);
        const externalChanged = !Object.is(value, lastValue) || encoded !== lastExternal;
        const ownFeedback = Object.is(value, lastCommittedValue) && encoded === lastCommitted;
        if (targetChanged || (externalChanged && !ownFeedback && !retainedCollectionSubject)) {
          subject += 1;
          text = encoded;
          invalid = false;
          errorCount = 0;
          diagnosticsPending = tracksDiagnostics();
          diagnosticFailure = false;
          lastCommitted = undefined;
          lastCommittedValue = undefined;
        }
        lastItemTarget = nextItemTarget;
        lastValue = value;
        lastExternal = encoded;
        lastPath = path;
        lastLanguage = language;
        lastConvert = convertJson;
        lastSchema = schemaKey;
        reconciling = false;
      });
    });
  });

  const message = $derived(
    translateEditorMessage(binding.locale, binding.translate, 'editor.invalidJson'),
  );
  const publishedCount = $derived(
    diagnosticFailure
      ? 1
      : binding.validateJsonSchema
        ? invalid
          ? 1
          : 0
        : invalid
          ? 1
          : errorCount,
  );
  const summary = $derived(
    diagnosticFailure
      ? translateEditorMessage(binding.locale, binding.translate, 'editor.validationFailed')
      : invalid
        ? message
        : translateEditorMessage(
            binding.locale,
            binding.translate,
            publishedCount === 1 ? 'editor.languageError' : 'editor.languageErrors',
          ).replaceAll('{count}', String(publishedCount)),
  );
  $effect(() => {
    if (!binding.propagateErrors || owner) warnedMissingStorePath = undefined;
    const signature = JSON.stringify([
      binding.propagateErrors,
      reconciling,
      diagnosticsPending,
      publishedCount,
      binding.path,
      binding.language,
      summary,
    ]);
    if (signature === published) return;
    published = signature;
    if (!owner) {
      if (binding.propagateErrors && warnedMissingStorePath !== binding.path) {
        warnedMissingStorePath = binding.path;
        reportDiagnostic('monaco.errorStoreUnavailable', {
          severity: 'warning',
          message: 'Monaco error publication requires the form-owned error store.',
          path: binding.path,
        });
      }
      return;
    }
    if (binding.propagateErrors && (reconciling || diagnosticsPending)) {
      owner.begin(dataPathToPointer(binding.pathSegments ?? binding.path), true);
      return;
    }
    if (!binding.propagateErrors || !publishedCount) {
      owner.clear();
      return;
    }
    const pointer = dataPathToPointer(binding.pathSegments ?? binding.path);
    const generation = owner.begin(pointer);
    owner.publish(generation, [
      {
        keyword: 'editor',
        instancePath: '',
        schemaPath: '',
        params: { language: binding.language, errorCount: publishedCount },
        message: summary,
      },
    ]);
  });

  return {
    get subject() {
      return subject;
    },
    get text() {
      return text;
    },
    get invalid() {
      return invalid;
    },
    get message() {
      return invalid ? message : '';
    },
    get updateDiagnosticsFailure() {
      const generation = subject;
      return () => {
        if (mounted && generation === subject) diagnosticFailure = true;
      };
    },
    get updateDiagnosticsPending() {
      const generation = subject;
      return (pending: boolean) => {
        if (mounted && generation === subject) diagnosticsPending = pending;
      };
    },
    get updateDiagnostics() {
      const generation = subject;
      return (count: number) => {
        if (mounted && !reconciling && generation === subject) {
          errorCount = count;
          diagnosticFailure = false;
        }
      };
    },
    update(value: string) {
      if (!binding.enabled || reconciling || !mounted) return;
      text = value;
      const next = fromMonacoEditorValue(value, binding.language, binding.convertJson);
      invalid = !next.valid;
      if (next.valid) {
        lastCommitted = toMonacoEditorValue(next.value, binding.language, binding.convertJson);
        lastCommittedValue = next.value;
        binding.onChange(next.value);
      }
    },
  };
}
