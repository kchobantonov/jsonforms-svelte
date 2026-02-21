<script lang="ts">
  import { type ControlProps, useJsonFormsOneOfEnumControl } from '@chobantonov/jsonforms-svelte';
  import { Select } from 'flowbite-svelte';
  import { twMerge } from 'tailwind-merge';
  import ControlWrapper from '../controls/ControlWrapper.svelte';
  import { determineClearValue, useFlowbiteControl } from '../util';

  const props: ControlProps = $props();

  const clearValue = determineClearValue('');

  const binding = useFlowbiteControl(
    useJsonFormsOneOfEnumControl(props),
    (value) => (value === null ? clearValue : value),
    300,
  );

  const selectItems = $derived(
    binding.control.options.map((option) => ({
      value: option.value,
      name: option.label,
    })),
  );

  const inputprops = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Select');

    return {
      ...flowbiteProps,

      id: `${binding.control.id}-input`,
      class: twMerge('w-full', binding.styles.control.input, flowbiteProps.class),
      disabled: !binding.control.enabled,
      items: selectItems,
      autofocus: binding.appliedOptions.focus,
      placeholder: binding.appliedOptions.placeholder,
      value: binding.control.data,
      clearable: binding.clearable,
      onchange: (e: Event) => binding.onChange((e.target as HTMLSelectElement).value),
      clearableOnClick: () => {
        binding.onChange(clearValue);
      },
      onfocus: binding.handleFocus,
      onblur: binding.handleBlur,
      required: binding.control.required,
      'aria-invalid': !!binding.control.errors,
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper}>
  <Select {...inputprops}></Select>
</ControlWrapper>
