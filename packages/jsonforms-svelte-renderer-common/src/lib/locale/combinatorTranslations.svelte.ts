import {
  combinatorDefaultTranslations,
  defaultJsonFormsI18nState,
  getCombinatorTranslations,
} from '@jsonforms/core';
import { useJsonForms, useOverrideControl } from '../core/jsonFormsCompositions.svelte';
import { useRendererMessages } from './rendererMessages.svelte';

export const useCombinatorTranslations = <
  T extends {
    i18nKeyPrefix: string;
    label: string;
  },
  I extends {
    control: T;
  },
>(
  input: I,
) => {
  const jsonforms = useJsonForms();
  const message = useRendererMessages();
  const translations = $derived(
    getCombinatorTranslations(
      jsonforms?.i18n?.translate ?? defaultJsonFormsI18nState.translate,
      combinatorDefaultTranslations
        .filter((entry) => !entry.key.startsWith('clearDialog'))
        .map((entry) => ({
          ...entry,
          default: () => message(`combinator.${entry.key}`),
        })),
      input.control.i18nKeyPrefix,
      input.control.label,
    ),
  );

  return useOverrideControl(input, {
    get translations() {
      return translations;
    },
  });
};
