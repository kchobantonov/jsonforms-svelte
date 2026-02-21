<script lang="ts">
  import { type ControlProps, useJsonFormsOneOfEnumControl } from '@chobantonov/jsonforms-svelte';
  import { Radio } from 'flowbite-svelte';
  import { twMerge } from 'tailwind-merge';
  import ControlWrapper from '../controls/ControlWrapper.svelte';
  import { useFlowbiteControl } from '../util';

  const props: ControlProps = $props();

  const binding = useFlowbiteControl(useJsonFormsOneOfEnumControl(props));

  const inputprops = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Radio');

    return {
      ...flowbiteProps,

      id: `${binding.control.id}-input`,
      class: twMerge(binding.styles.control.input, flowbiteProps.class),
      disabled: !binding.control.enabled,
      required: binding.control.required,
      'aria-invalid': !!binding.control.errors,
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
      <Radio
        {...inputprops}
        id={binding.control.id + '-' + option.value}
        value={option.value}
        group={binding.control.data}
        onchange={() => binding.onChange(option.value)}
      >
        {option.label}
      </Radio>
    {/each}
  </div>
</ControlWrapper>
