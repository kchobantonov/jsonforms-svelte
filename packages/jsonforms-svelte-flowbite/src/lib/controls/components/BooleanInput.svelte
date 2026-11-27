<script lang="ts">
  import {
    type ControlProps,
    useJsonFormsControl,
    useBooleanControl,
    BooleanField,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { Checkbox, Toggle } from 'flowbite-svelte';
  import { twMerge } from 'tailwind-merge';
  import { determineClearValue, useFlowbiteControl } from '../../util';
  import ControlWrapper from '../ControlWrapper.svelte';
  import BooleanClearButton from './BooleanClearButton.svelte';

  const { toggle, ...props }: ControlProps & { toggle?: boolean } = $props();

  const binding = useFlowbiteControl(useJsonFormsControl(props));
  const control = useBooleanControl(props, binding, determineClearValue(false));
  const booleanState = control.state;

  const inputprops = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps(toggle ? 'Toggle' : 'Checkbox');
    const attributes = control.inputAttributes(flowbiteProps['aria-describedby']);

    return {
      ...flowbiteProps,

      ...attributes,
      class: twMerge(binding.styles.control.input, flowbiteProps.class),
      disabled: !binding.control.enabled || binding.control.readonly,
      placeholder: binding.appliedOptions.placeholder,
      checked: booleanState.checked,
      oninput: (e: Event) => control.change((e.target as HTMLInputElement).checked),
      required: false,
    };
  });
</script>

<BooleanField
  {control}
  wrapperProps={binding.controlWrapper}
  {ControlWrapper}
  {BooleanClearButton}
  center={!toggle && !!binding.appliedOptions.hideControlWrapper}
>
  {#if toggle}<Toggle {...inputprops} />{:else}<Checkbox
      {...inputprops}
      indeterminate={booleanState.indeterminate}
    />{/if}
</BooleanField>
