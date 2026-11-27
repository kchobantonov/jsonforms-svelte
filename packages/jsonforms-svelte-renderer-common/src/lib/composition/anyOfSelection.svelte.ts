import { showAdditionalPropertyEditor } from '../objects/additionalPropertySchema';
import { createCombinatorRenderInfos, type CombinatorSubSchemaRenderInfo } from '@jsonforms/core';
import { useTranslator } from '@chobantonov/jsonforms-svelte';
import type { useJsonFormsAnyOfControl } from '../core/jsonFormsCompositions.svelte';
import { scalarCompositionProps } from './scalarComposition';
import { compositionViewIndex } from './combinators';
import { discriminatorBranch } from './discriminatorBranch';

export function useAnyOfSelection(
  binding: Pick<ReturnType<typeof useJsonFormsAnyOfControl>, 'control'> & {
    appliedOptions: Record<string, unknown>;
  },
) {
  const scalarControl = $derived(scalarCompositionProps(binding.control));

  let chosenIndex = $state<number | undefined>(undefined);

  const translator = useTranslator();

  // Computed values
  const anyOfRenderInfos = $derived.by((): CombinatorSubSchemaRenderInfo[] => {
    const result = createCombinatorRenderInfos(
      binding.control.schema.anyOf!,
      binding.control.rootSchema,
      'anyOf',
      binding.control.uischema,
      binding.control.path,
      binding.control.uischemas,
    );
    return result
      .filter((info) => info.uischema)
      .map((info) => {
        const prefix = (info.schema as { i18n?: string }).i18n;
        const key = typeof prefix === 'string' ? `${prefix}.label` : info.label;
        return { ...info, label: translator.value(key, info.label) ?? info.label };
      });
  });

  const selectedIndex = $derived(
    compositionViewIndex(
      chosenIndex,
      discriminatorBranch(
        binding.control.schema,
        binding.control.rootSchema,
        'anyOf',
        binding.control.data,
      ) ?? binding.control.indexOfFittingSchema,
      anyOfRenderInfos.length,
    ),
  );

  const allowWhenMissing = $derived(binding.appliedOptions.allowAdditionalPropertiesIfMissing);
  const selectedSchema = $derived(anyOfRenderInfos[selectedIndex]?.schema);
  const showAdditionalProperties = $derived(
    showAdditionalPropertyEditor(binding.control.schema, allowWhenMissing),
  );
  const showAnyOfAdditionalProperties = $derived(
    showAdditionalPropertyEditor(selectedSchema, allowWhenMissing),
  );
  const anyOfReservedPropertyNames = $derived(Object.keys(selectedSchema?.properties ?? {}));

  const reservedPropertyNames = $derived(
    anyOfRenderInfos.flatMap((anyOfRenderInfo) =>
      Object.keys(anyOfRenderInfo.schema.properties || {}),
    ),
  );
  return {
    select(index: number) {
      chosenIndex = index;
    },
    get scalarControl() {
      return scalarControl;
    },
    get anyOfRenderInfos() {
      return anyOfRenderInfos;
    },
    get selectedIndex() {
      return selectedIndex;
    },
    get showAdditionalProperties() {
      return showAdditionalProperties;
    },
    get showAnyOfAdditionalProperties() {
      return showAnyOfAdditionalProperties;
    },
    get anyOfReservedPropertyNames() {
      return anyOfReservedPropertyNames;
    },
    get reservedPropertyNames() {
      return reservedPropertyNames;
    },
  };
}
