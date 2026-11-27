import { controlHelpVisible, stringDescriptionIds } from './controlHelp';
import { enumChoices, invalidEnumValueText, selectedEnumId } from './enumChoices';
import type { useJsonFormsEnumControl } from '../core/jsonFormsCompositions.svelte';

export type EnumBinding = Pick<ReturnType<typeof useJsonFormsEnumControl>, 'control'> &
  Parameters<typeof controlHelpVisible>[0];

export function useEnumSelection(binding: EnumBinding) {
  const choices = $derived(enumChoices(binding.control.options));
  const invalidValue = $derived(
    invalidEnumValueText(binding.control.options, binding.control.data),
  );
  const selectedId = $derived(selectedEnumId(binding.control.options, binding.control.data));
  function describedBy(authored: unknown, id = binding.control.id) {
    return (
      stringDescriptionIds(
        authored,
        controlHelpVisible(binding) ? `${id}-help` : undefined,
        invalidValue !== undefined ? `${id}-invalid-value` : undefined,
      ) || undefined
    );
  }
  return {
    describedBy,
    get choices() {
      return choices;
    },
    get invalidValue() {
      return invalidValue;
    },
    get selectedId() {
      return selectedId;
    },
  };
}
