<script lang="ts">
  import { type ControlProps, useJsonFormsOneOfEnumControl } from '@chobantonov/jsonforms-svelte';
  import { Radio } from 'flowbite-svelte';
  import { twMerge } from 'tailwind-merge';
  import ControlWrapper from '../controls/ControlWrapper.svelte';
  import { useFlowbiteControl } from '../util';

  const props: ControlProps = $props();

  const input = useFlowbiteControl(useJsonFormsOneOfEnumControl(props));

  const inputprops = $derived.by(() => {
    const flowbiteProps = input.flowbiteProps('Radio');

    return {
      ...flowbiteProps,

      id: `${input.control.id}-input`,
      class: twMerge(input.styles.control.input, flowbiteProps.class),
      disabled: !input.control.enabled,
      required: input.control.required,
      'aria-invalid': !!input.control.errors,
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
      <Radio
        {...inputprops}
        id={input.control.id + '-' + option.value}
        value={option.value}
        group={input.control.data}
        onchange={() => input.onChange(option.value)}
      >
        {option.label}
      </Radio>
    {/each}
  </div>
</ControlWrapper>
