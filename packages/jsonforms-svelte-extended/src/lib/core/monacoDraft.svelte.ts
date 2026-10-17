import { dataPathToPointer } from '@chobantonov/jsonforms-svelte';
import { onDestroy, untrack } from 'svelte';
import type { JsonSchema, Translator } from '@jsonforms/core';
import { useOwnedErrors, registerDetailDialogChange } from '@chobantonov/jsonforms-svelte';
import { fromMonacoEditorValue, toMonacoEditorValue } from './monaco';
import { translateEditorMessage } from './editorMessages';

interface MonacoDraftBinding {
  readonly value: unknown;
  readonly schema: JsonSchema;
  readonly path: string;
  readonly language: string;
  readonly convertJson: boolean;
  readonly enabled: boolean;
  readonly propagateErrors: boolean;
  readonly validateJsonSchema?: boolean;
  readonly locale: string | undefined;
  readonly translate: Translator | undefined;
  onChange(value: unknown): void;
}

/** Keeps an editable JSON draft independently of the last successfully parsed value. */
export function useMonacoDraft(binding: MonacoDraftBinding) {
  const owner = useOwnedErrors()?.createOwner();
  onDestroy(() => owner?.dispose());
  let text = $state(
    untrack(() => toMonacoEditorValue(binding.value, binding.language, binding.convertJson)),
  );
  let invalid = $state(false);
  let errorCount = $state(0);
  registerDetailDialogChange({ isBlocked: () => invalid });
  let lastExternal = untrack(() => text);
  let lastCommitted: string | undefined;
  let lastPath = untrack(() => binding.path);
  let lastLanguage = untrack(() => binding.language);
  let lastConvert = untrack(() => binding.convertJson);
  let lastSchema = untrack(() => JSON.stringify(binding.schema));
  let published: string | undefined;
  let warnedMissingStore = false;

  $effect(() => {
    const encoded = toMonacoEditorValue(binding.value, binding.language, binding.convertJson);
    const schemaKey = JSON.stringify(binding.schema);
    const targetChanged =
      binding.path !== lastPath ||
      binding.language !== lastLanguage ||
      binding.convertJson !== lastConvert ||
      schemaKey !== lastSchema;
    if (targetChanged || (encoded !== lastExternal && encoded !== lastCommitted)) {
      text = encoded;
      invalid = false;
      errorCount = 0;
      lastCommitted = undefined;
    }
    lastExternal = encoded;
    lastPath = binding.path;
    lastLanguage = binding.language;
    lastConvert = binding.convertJson;
    lastSchema = schemaKey;
  });

  const message = $derived(
    translateEditorMessage(binding.locale, binding.translate, 'editor.invalidJson'),
  );
  const publishedCount = $derived(
    binding.validateJsonSchema ? (invalid ? 1 : 0) : invalid ? 1 : errorCount,
  );
  const summary = $derived(
    invalid
      ? message
      : translateEditorMessage(
          binding.locale,
          binding.translate,
          publishedCount === 1 ? 'editor.languageError' : 'editor.languageErrors',
        ).replaceAll('{count}', String(publishedCount)),
  );
  $effect(() => {
    const signature = JSON.stringify([
      binding.propagateErrors,
      publishedCount,
      binding.path,
      binding.language,
      summary,
    ]);
    if (signature === published) return;
    published = signature;
    if (!owner) {
      if (binding.propagateErrors && !warnedMissingStore) {
        warnedMissingStore = true;
        console.warn('[jsonforms] Monaco error publication requires the form-owned error store.');
      }
      return;
    }
    if (!binding.propagateErrors || !publishedCount) {
      owner.clear();
      return;
    }
    const pointer = dataPathToPointer(binding.path);
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
    get text() {
      return text;
    },
    get invalid() {
      return invalid;
    },
    get message() {
      return invalid ? message : '';
    },
    updateDiagnostics(count: number) {
      errorCount = count;
    },
    update(value: string) {
      if (!binding.enabled) return;
      text = value;
      const next = fromMonacoEditorValue(value, binding.language, binding.convertJson);
      invalid = !next.valid;
      if (next.valid) {
        lastCommitted = toMonacoEditorValue(next.value, binding.language, binding.convertJson);
        binding.onChange(next.value);
      }
    },
  };
}
