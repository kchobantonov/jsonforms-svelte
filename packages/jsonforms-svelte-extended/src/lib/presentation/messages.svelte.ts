import { useRendererMessages } from '@chobantonov/jsonforms-svelte-renderer-common';
export function usePresentationMessages() {
  const message = useRendererMessages();
  return (
    key:
      | 'markdownDisabled'
      | 'markupUnsupported'
      | 'interpolationFailed'
      | 'loadFailed'
      | 'interpolationLoadFailed'
      | 'urlRefused',
    params: Record<string, string> = {},
  ): string => message(`markup.${key === 'markupUnsupported' ? 'unsupported' : key}`, params);
}
