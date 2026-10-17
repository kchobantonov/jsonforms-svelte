<script lang="ts">
  import {
    type ControlProps,
    useJsonFormsControl,
    useBooleanState,
  } from '@chobantonov/jsonforms-svelte';
  import { Checkbox } from 'flowbite-svelte';
  import { twMerge } from 'tailwind-merge';
  import { useFlowbiteControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';

  const props: ControlProps = $props();

  const binding = useFlowbiteControl(useJsonFormsControl(props));
  const booleanState = useBooleanState(() => binding.control.data);
  const stateId = $derived(`${binding.control.id}-boolean-state`);
  const changeBoolean = (value: boolean) => {
    if (binding.control.enabled) binding.onChange(value);
  };

  const inputprops = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Checkbox');

    return {
      ...flowbiteProps,

      id: `${binding.control.id}-input`,
      class: twMerge(binding.styles.control.input, flowbiteProps.class),
      disabled: !binding.control.enabled,
      autofocus: binding.appliedOptions.focus,
      placeholder: binding.appliedOptions.placeholder,
      checked: booleanState.checked,
      indeterminate: booleanState.indeterminate,
      oninput: (e: Event) => changeBoolean((e.target as HTMLInputElement).checked),
      onfocus: binding.handleFocus,
      onblur: binding.handleBlur,
      required: false,
      'aria-required': binding.control.required,
      'aria-describedby': booleanState.describeWith(flowbiteProps['aria-describedby'], stateId),
      'aria-label': binding.appliedOptions.hideControlWrapper ? binding.control.label : undefined,
      'aria-invalid': !!binding.control.errors,
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper} layout="horizontal">
  <Checkbox {...inputprops}></Checkbox>
  {#if booleanState.hint !== undefined}
    <span id={stateId} class="sr-only" data-boolean-state>{booleanState.hint}</span>
  {/if}
</ControlWrapper>
