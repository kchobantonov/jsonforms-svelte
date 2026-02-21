<script lang="ts">
  import { useJsonFormsMultiEnumControl, type RendererProps } from '@chobantonov/jsonforms-svelte';
  import { type ControlElement } from '@jsonforms/core';
  import { Checkbox } from 'flowbite-svelte';
  import { twMerge } from 'tailwind-merge';
  import ControlWrapper from '../controls/ControlWrapper.svelte';
  import { useFlowbiteControl } from '../util';

  const props: RendererProps<ControlElement> = $props();

  const binding = useFlowbiteControl(useJsonFormsMultiEnumControl(props));

  function dataHasEnum(value: any): boolean {
    return !!binding.control.data?.includes(value);
  }

  const inputprops = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Checkbox');

    return {
      ...flowbiteProps,

      id: `${binding.control.id}-input`,
      class: twMerge(binding.styles.control.input, flowbiteProps.class),
      disabled: !binding.control.enabled,
      indeterminate: binding.control.data === undefined,
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper}>
  <div
    onfocus={binding.handleFocus}
    onblur={binding.handleBlur}
    class={`flex gap-2 ${binding.appliedOptions.vertical ? 'flex-col' : 'flex-row'}`}
  >
    {#each binding.control.options as option, index (option.value)}
      <Checkbox
        {...inputprops}
        id={binding.control.id + '-' + option.value}
        checked={dataHasEnum(option.value)}
        oninput={(e: Event) =>
          (e.target as HTMLInputElement).checked
            ? binding.addItem(binding.control.path, option.value)
            : binding.removeItem?.(binding.control.path, option.value)}>{option.label}</Checkbox
      >
    {/each}
  </div>
</ControlWrapper>
