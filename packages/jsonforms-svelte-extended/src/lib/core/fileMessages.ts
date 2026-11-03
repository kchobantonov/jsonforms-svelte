import type { Translator } from '@jsonforms/core';

import { rendererMessage } from '@chobantonov/jsonforms-svelte';
type MessageKey =
  | 'file.upload.inProgress'
  | 'file.reading'
  | 'file.cancel'
  | 'file.clear'
  | 'file.clearAll'
  | 'file.select'
  | 'file.selectMultiple'
  | 'file.replace'
  | 'file.attached'
  | 'file.numbered'
  | 'file.attachments'
  | 'file.remove'
  | 'file.rejected'
  | 'file.maxItems'
  | 'file.readFailed'
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
  const fallback = rendererMessage(locale, key);
  const message = translate?.(key, fallback, params) ?? fallback;
  return message.replace(/\$?\{(\w+)\}/g, (match, name: string) => params[name] ?? match);
}
