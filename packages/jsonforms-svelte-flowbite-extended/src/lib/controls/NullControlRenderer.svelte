<script lang="ts">
  import { type ControlProps, useJsonFormsControl } from '@chobantonov/jsonforms-svelte';
  import { ControlWrapper, useFlowbiteControl } from '@chobantonov/jsonforms-svelte-flowbite';
  import { Checkbox } from 'flowbite-svelte';
  import { twMerge } from 'tailwind-merge';

  const props: ControlProps = $props();
  const clearValue = undefined;
  const binding = useFlowbiteControl(useJsonFormsControl(props));

  const inputProps = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Checkbox');

    return {
      ...flowbiteProps,
      id: `${binding.control.id}-input`,
      class: twMerge(binding.styles.control.input, flowbiteProps.class),
      disabled: !binding.control.enabled,
      autofocus: binding.appliedOptions.focus,
      checked: binding.control.data === null,
      indeterminate: binding.control.data === undefined,
      oninput: (event: Event) =>
        binding.onChange((event.target as HTMLInputElement).checked ? null : clearValue),
      onfocus: binding.handleFocus,
      onblur: binding.handleBlur,
      required: binding.control.required,
      'aria-invalid': !!binding.control.errors,
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper} layout="horizontal">
  <Checkbox {...inputProps}></Checkbox>
</ControlWrapper>
