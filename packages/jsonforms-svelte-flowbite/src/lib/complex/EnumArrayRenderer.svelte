<script lang="ts">
  import { useJsonFormsMultiEnumControl, type RendererProps } from '@chobantonov/jsonforms-svelte';
  import { type ControlElement } from '@jsonforms/core';
  import { Checkbox } from 'flowbite-svelte';
  import { twMerge } from 'tailwind-merge';
  import ControlWrapper from '../controls/ControlWrapper.svelte';
  import { useFlowbiteControl } from '../util';

  const props: RendererProps<ControlElement> = $props();

  const input = useFlowbiteControl(useJsonFormsMultiEnumControl(props));

  function dataHasEnum(value: any): boolean {
    return !!input.control.data?.includes(value);
  }

  const inputprops = $derived.by(() => {
    const flowbiteProps = input.flowbiteProps('Checkbox');

    return {
      ...flowbiteProps,

      id: `${input.control.id}-input`,
      class: twMerge(input.styles.control.input, flowbiteProps.class),
      disabled: !input.control.enabled,
      indeterminate: input.control.data === undefined,
    };
  });
</script>

<ControlWrapper {...input.controlWrapper}>
  <div
    onfocus={input.handleFocus}
    onblur={input.handleBlur}
    class={`flex gap-2 ${input.appliedOptions.vertical ? 'flex-col' : 'flex-row'}`}
  >
    {#each input.control.options as option, index (option.value)}
      <Checkbox
        {...inputprops}
        id={input.control.id + '-' + option.value}
        checked={dataHasEnum(option.value)}
        oninput={(e: Event) =>
          (e.target as HTMLInputElement).checked
            ? input.addItem(input.control.path, option.value)
            : input.removeItem?.(input.control.path, option.value)}>{option.label}</Checkbox
      >
    {/each}
  </div>
</ControlWrapper>
