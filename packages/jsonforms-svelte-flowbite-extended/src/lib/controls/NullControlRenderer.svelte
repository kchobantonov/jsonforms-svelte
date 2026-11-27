<script lang="ts">
  import {
    nullCheckbox,
    type ControlProps,
    useJsonFormsControl,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { ControlWrapper, useFlowbiteControl } from '@chobantonov/jsonforms-svelte-flowbite';
  import { Checkbox } from 'flowbite-svelte';
  import { twMerge } from 'tailwind-merge';

  const props: ControlProps = $props();
  const binding = useFlowbiteControl(useJsonFormsControl(props));

  const inputProps = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Checkbox');

    const checkbox = nullCheckbox(binding, flowbiteProps['aria-describedby']);
    return {
      ...flowbiteProps,
      ...checkbox.attributes,
      class: twMerge(binding.styles.control.input, flowbiteProps.class),
      oninput: checkbox.oninput,
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper} layout="horizontal">
  <Checkbox {...inputProps}></Checkbox>
</ControlWrapper>
