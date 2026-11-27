import { useEnumSelection, type EnumBinding } from './enumSelection.svelte';
import { untrack } from 'svelte';
import { resolveRadioVertical } from './radioOptions';

export function useRadioGroup(binding: EnumBinding) {
  const selection = useEnumSelection(binding);
  const initialChoiceId = untrack(
    () =>
      selection.choices.find((option) => option.id === selection.selectedId)?.id ??
      selection.choices[0]?.id,
  );
  const vertical = $derived(
    resolveRadioVertical(binding.control.uischema.options, binding.control.config),
  );
  return {
    initialChoiceId,
    get choices() {
      return selection.choices;
    },
    get invalidValue() {
      return selection.invalidValue;
    },
    get selectedId() {
      return selection.selectedId;
    },
    get vertical() {
      return vertical;
    },
    describe: selection.describedBy,
  };
}
