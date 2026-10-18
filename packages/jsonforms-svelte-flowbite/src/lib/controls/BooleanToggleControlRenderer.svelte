<script lang="ts">
  import {
    type ControlProps,
    useJsonFormsControl,
    useBooleanState,
  } from '@chobantonov/jsonforms-svelte';
  import { Toggle } from 'flowbite-svelte';
  import { twMerge } from 'tailwind-merge';
  import { determineClearValue, useFlowbiteControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';
  import BooleanClearButton from './components/BooleanClearButton.svelte';

  const props: ControlProps = $props();

  const binding = useFlowbiteControl(useJsonFormsControl(props));
  const clearValue = determineClearValue(false);
  const canClear = $derived(
    binding.control.visible && binding.clearable && binding.control.data !== undefined,
  );
  const clearBoolean = () => {
    if (canClear) binding.onChange(booleanState.arrayItem ? false : clearValue);
  };
  const booleanState = useBooleanState(
    () => binding.control.data,
    () => binding.control.path,
  );
  const stateId = $derived(`${binding.control.id}-boolean-state`);
  const changeBoolean = (value: boolean) => {
    if (binding.control.enabled && !binding.control.readonly) binding.onChange(value);
  };

  const inputprops = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Toggle');

    return {
      ...flowbiteProps,

      id: `${binding.control.id}-input`,
      class: twMerge(binding.styles.control.input, flowbiteProps.class),
      disabled: !binding.control.enabled || binding.control.readonly,
      autofocus: binding.appliedOptions.focus,
      placeholder: binding.appliedOptions.placeholder,
      checked: booleanState.checked,
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

<div class="group/boolean inline-flex max-w-full items-start gap-1">
  <ControlWrapper {...binding.controlWrapper} layout="horizontal">
    <Toggle {...inputprops}></Toggle>
    {#if booleanState.hint !== undefined}
      <span id={stateId} class="sr-only" data-boolean-state>{booleanState.hint}</span>
    {/if}
  </ControlWrapper>
  {#if canClear}<BooleanClearButton onclick={clearBoolean} />{/if}
</div>
