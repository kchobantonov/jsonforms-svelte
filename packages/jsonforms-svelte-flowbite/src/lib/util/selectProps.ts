import type { useFlowbiteControl } from './composition.svelte';
import { twMerge } from 'tailwind-merge';

export function selectProps(binding: ReturnType<typeof useFlowbiteControl>) {
  const vendor = binding.flowbiteProps('Select');
  return {
    ...vendor,
    id: `${binding.control.id}-input`,
    class: twMerge('w-full', binding.styles.control.input, vendor.class),
    disabled: !binding.control.enabled,
    autofocus: binding.initialFocus,
    placeholder: binding.appliedOptions.placeholder,
    clearable: binding.clearable,
    onfocus: binding.handleFocus,
    onblur: binding.handleBlur,
    required: binding.control.required,
  };
}
