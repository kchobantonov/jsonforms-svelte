import type { Translator } from '@jsonforms/core';

import { rendererMessage } from '@chobantonov/jsonforms-svelte';
type MessageKey =
  | 'editor.loading'
  | 'editor.loadError'
  | 'editor.maximize'
  | 'editor.restore'
  | 'editor.invalidJson'
  | 'editor.languageError'
  | 'editor.languageErrors';
export function translateEditorMessage(
  locale: string | undefined,
  translate: Translator | undefined,
  key: MessageKey,
): string {
  const fallback = rendererMessage(locale, key);
  return translate?.(key, fallback) ?? fallback;
}
