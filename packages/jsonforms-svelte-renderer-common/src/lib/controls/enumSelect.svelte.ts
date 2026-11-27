import { useEnumSelection, type EnumBinding } from './enumSelection.svelte';

export function useEnumSelect(
  binding: EnumBinding & { onChange(value: unknown): void },
  clear?: () => void,
) {
  const selection = useEnumSelection(binding);
  const selectItems = $derived(
    selection.choices.map((option) => ({ value: option.id, name: option.label })),
  );
  function selectChoice(id: string) {
    const option = selection.choices.find((candidate) => candidate.id === id);
    if (option) binding.onChange(option.value);
    else if (id === '') clear?.();
  }
  return {
    selectChoice,
    describedBy: selection.describedBy,
    get choices() {
      return selection.choices;
    },
    get invalidValue() {
      return selection.invalidValue;
    },
    get selectedId() {
      return selection.selectedId;
    },
    get selectItems() {
      return selectItems;
    },
  };
}
