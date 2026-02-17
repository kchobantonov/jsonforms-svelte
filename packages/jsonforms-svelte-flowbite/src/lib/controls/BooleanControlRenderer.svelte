<script lang="ts">
  import { type ControlProps, useJsonFormsControl } from '@chobantonov/jsonforms-svelte';
  import { Checkbox } from 'flowbite-svelte';
  import { twMerge } from 'tailwind-merge';
  import { useFlowbiteControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';

  const props: ControlProps = $props();

  const input = useFlowbiteControl(useJsonFormsControl(props));

  const inputprops = $derived.by(() => {
    const flowbiteProps = input.flowbiteProps('Checkbox');

    return {
      ...flowbiteProps,

      id: `${input.control.id}-input`,
      class: twMerge(input.styles.control.input, flowbiteProps.class),
      disabled: !input.control.enabled,
      autofocus: input.appliedOptions.focus,
      placeholder: input.appliedOptions.placeholder,
      checked: !!input.control.data,
      indeterminate: input.control.data === undefined,
      oninput: (e: Event) => input.onChange((e.target as HTMLInputElement).checked),
      onfocus: input.handleFocus,
      onblur: input.handleBlur,
      required: input.control.required,
      'aria-invalid': !!input.control.errors,
    };
  });
</script>

<ControlWrapper {...input.controlWrapper} layout="horizontal">
  <Checkbox {...inputprops}></Checkbox>
</ControlWrapper>
