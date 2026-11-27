import { controlHelpVisible, joinDescriptionIds } from './controlHelp';
import type { useBooleanControl } from './booleanState.svelte';

export function nullCheckbox(
  binding: Parameters<typeof useBooleanControl>[1],
  description: unknown,
) {
  const { control } = binding;
  const describedBy = joinDescriptionIds(
    description,
    controlHelpVisible(binding, !!control.errors) ? `${control.id}-help` : undefined,
  );
  const change = (checked: boolean) => binding.onChange(checked ? null : undefined);
  return {
    change,
    describedBy,
    attributes: {
      id: `${control.id}-input`,
      checked: control.data === null,
      indeterminate: control.data === undefined,
      disabled: !control.enabled || control.readonly,
      autofocus: binding.initialFocus,
      required: control.required,
      onfocus: binding.handleFocus,
      onblur: binding.handleBlur,
      'aria-invalid': !!control.errors,
      'aria-describedby': describedBy,
    },
    oninput: (event: Event) => change((event.target as HTMLInputElement).checked),
  };
}
