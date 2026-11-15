import { useJsonForms, useTranslator } from './jsonFormsCompositions.svelte';
import { rendererMessage } from './rendererMessages';

/** Host translations take precedence, including intentionally empty translations. */
export function useRendererMessages(optional?: true) {
  const form = optional ? useJsonForms(true) : useJsonForms();
  const translator = optional ? useTranslator(true) : useTranslator();
  return (key: string, params: Record<string, unknown> = {}): string => {
    const fallback = rendererMessage(form?.i18n?.locale, key);
    const message = translator.value?.(key, fallback, params) ?? fallback;
    return message.replace(/\$?\{(\w+)\}/g, (match, name: string) =>
      Object.hasOwn(params, name) ? String(params[name] ?? '') : match,
    );
  };
}
