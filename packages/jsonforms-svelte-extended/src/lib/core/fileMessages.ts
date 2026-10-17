import type { Translator } from '@jsonforms/core';

import { rendererMessage } from '@chobantonov/jsonforms-svelte';
type MessageKey =
  | 'file.upload.inProgress'
  | 'file.cancel'
  | 'file.clear'
  | 'file.select'
  | 'file.selectMultiple'
  | 'file.replace'
  | 'file.attached'
  | 'file.attachments'
  | 'file.remove'
  | 'error.fileCount'
  | 'error.fileMaximum'
  | 'error.fileExclusiveMaximum'
  | 'error.fileMinimum'
  | 'error.fileExclusiveMinimum'
  | 'error.fileConversion';
export type FileMessageKey = MessageKey;
export function translateFileMessage(
  locale: string | undefined,
  translate: Translator | undefined,
  key: FileMessageKey,
  params: Record<string, string> = {},
): string {
  const fallback = rendererMessage(locale, key).replace(
    /\$\{(\w+)\}/g,
    (match, name: string) => params[name] ?? match,
  );
  return translate?.(key, fallback, params) ?? fallback;
}
