<script lang="ts">
  import {
    EnumArrayGroup,
    useJsonFormsMultiEnumControl,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { type ControlElement } from '@jsonforms/core';
  import { Checkbox } from 'flowbite-svelte';
  import { twMerge } from 'tailwind-merge';
  import ControlWrapper from '../controls/ControlWrapper.svelte';
  import { useFlowbiteControl } from '../util';

  const props: RendererProps<ControlElement> = $props();
  const binding = useFlowbiteControl(useJsonFormsMultiEnumControl(props));

  const inputprops = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Checkbox');

    return {
      ...flowbiteProps,

      id: `${binding.control.id}-input`,
      class: twMerge(binding.styles.control.input, flowbiteProps.class),
      disabled: !binding.control.enabled,
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper}>
  <EnumArrayGroup {props} {binding}>
    {#snippet item(optionId, label, isChecked, disabled, toggle)}
      <Checkbox
        {...inputprops}
        id={optionId}
        bind:checked={isChecked, (value) => toggle(value === true)}
        {disabled}>{label}</Checkbox
      >
    {/snippet}
  </EnumArrayGroup>
</ControlWrapper>
