<script lang="ts">
  import { InvalidChoiceValue } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { useRadioGroup } from '@chobantonov/jsonforms-svelte-renderer-common';

  import { type useJsonFormsEnumControl } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { Radio } from 'flowbite-svelte';
  import { twMerge } from 'tailwind-merge';
  import ControlWrapper from './ControlWrapper.svelte';
  import { useFlowbiteControl } from '../util';

  const props: { control: ReturnType<typeof useJsonFormsEnumControl> } = $props();

  const binding = useFlowbiteControl(props.control);
  const radio = useRadioGroup(binding);
  const { choices, invalidValue, selectedId, vertical, initialChoiceId } = $derived(radio);

  const inputprops = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Radio');
    const describedBy = radio.describe(flowbiteProps['aria-describedby']);
    return {
      ...flowbiteProps,

      id: `${binding.control.id}-input`,
      class: twMerge(binding.styles.control.input, flowbiteProps.class),
      disabled: !binding.control.enabled,
      required: binding.control.required,
      'aria-invalid': !!binding.control.errors,
      'aria-describedby': describedBy || undefined,
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper}>
  <div
    data-radio-orientation={vertical ? 'vertical' : 'horizontal'}
    role="radiogroup"
    aria-label={binding.control.label}
    onfocusin={binding.handleFocus}
    onfocusout={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) binding.handleBlur();
    }}
    class={`flex gap-2 ${vertical ? 'flex-col' : 'flex-row'}`}
  >
    {#each choices as option, index (option.id)}
      <Radio
        {...inputprops}
        id={index === 0 ? `${binding.control.id}-input` : `${binding.control.id}-${option.id}`}
        autofocus={option.id === initialChoiceId && binding.initialFocus}
        value={option.id}
        group={selectedId}
        onchange={() => binding.onChange(option.value)}
      >
        {option.label}
      </Radio>
    {/each}
  </div>
  <InvalidChoiceValue controlId={binding.control.id} value={invalidValue} />
</ControlWrapper>
