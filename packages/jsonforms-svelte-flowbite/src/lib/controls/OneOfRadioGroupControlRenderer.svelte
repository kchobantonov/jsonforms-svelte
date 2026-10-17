<script lang="ts">
  import {
    enumChoices,
    selectedEnumId,
    type ControlProps,
    useJsonFormsOneOfEnumControl,
  } from '@chobantonov/jsonforms-svelte';
  import { Radio } from 'flowbite-svelte';
  import { twMerge } from 'tailwind-merge';
  import ControlWrapper from '../controls/ControlWrapper.svelte';
  import { useFlowbiteControl } from '../util';

  const props: ControlProps = $props();

  const binding = useFlowbiteControl(useJsonFormsOneOfEnumControl(props));
  const choices = $derived(enumChoices(binding.control.options));
  const selectedId = $derived(selectedEnumId(binding.control.options, binding.control.data));

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
    {#each choices as option (option.id)}
      <Radio
        {...inputprops}
        id={binding.control.id + '-' + option.id}
        value={option.id}
        group={selectedId}
        onchange={() => binding.onChange(option.value)}
      >
        {option.label}
      </Radio>
    {/each}
  </div>
</ControlWrapper>
