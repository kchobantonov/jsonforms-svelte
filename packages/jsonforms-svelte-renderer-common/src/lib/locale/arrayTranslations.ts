import { arrayDefaultTranslations } from '@jsonforms/core';
import type { useRendererMessages } from './rendererMessages.svelte';

export function rendererArrayDefaults(message: ReturnType<typeof useRendererMessages>) {
  return arrayDefaultTranslations.map((entry) => ({
    ...entry,
    default: (label = '') => {
      const withLabel = label && (entry.key === 'addTooltip' || entry.key === 'addAriaLabel');
      return message(`array.${entry.key}${withLabel ? 'WithLabel' : ''}`, { label });
    },
  }));
}
