import type Ajv from 'ajv';
import { getContext, setContext } from 'svelte';
import { computeLabel, type UISchemaElement } from '@jsonforms/core';
import { useJsonForms } from '@chobantonov/jsonforms-svelte';
import { useAuthoredConfig } from './jsonFormsCompositions.svelte';
import { mergeRendererOptions, resolveRestrict } from './options';

export function useAppliedRendererOptions<T extends Record<string, unknown>>(
  source: () => {
    config: unknown;
    uischema: UISchemaElement;
  },
) {
  const authored = useAuthoredConfig();
  const options = $derived.by(() => {
    const { config, uischema } = source();
    return mergeRendererOptions<T>(config, uischema.options, {
      restrict: resolveRestrict(uischema.options, authored.value),
    });
  });
  return {
    get value() {
      return options;
    },
  };
}

export const useComputedLabel = <
  T extends { label: string; required: boolean },
  I extends { control: T },
>(
  input: I,
  appliedOptions: { value: Record<string, unknown> },
) => {
  const label = $derived(
    computeLabel(
      input.control.label,
      input.control.required,
      !!appliedOptions.value.hideRequiredAsterisk,
    ),
  );

  return {
    get value() {
      return label;
    },
  };
};

/**
 * Extracts Ajv from JSON Forms
 */
export const useAjv = () => {
  const jsonforms = useJsonForms();

  // should always exist
  return jsonforms.core?.ajv as Ajv;
};

export interface NestedInfo {
  level: number;
  parentElement?: 'array' | 'object';
}

export const useNestedInfo = (key: symbol, element: false | 'array' | 'object'): NestedInfo => {
  const nestedInfo = getContext<NestedInfo>(key) ?? {
    level: 0,
  };
  if (element) {
    setContext(key, {
      level: nestedInfo.level + 1,
      parentElement: element,
    });
  }
  return nestedInfo;
};
