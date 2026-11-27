<script lang="ts">
  import { checkboxClass } from '../util/checkboxClass';
  import {
    type ControlProps,
    useJsonFormsControl,
    useBooleanControl,
    BooleanField,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { twMerge } from 'tailwind-merge';
  import { determineClearValue, useSkeletonControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';
  import BooleanClearButton from './components/BooleanClearButton.svelte';

  const props: ControlProps = $props();

  const binding = useSkeletonControl(useJsonFormsControl(props));
  const control = useBooleanControl(props, binding, determineClearValue(false));
  const booleanState = control.state;

  const inputprops = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('checkbox');
    const attributes = control.inputAttributes(skeletonProps['aria-describedby']);

    return {
      ...skeletonProps,
      ...attributes,
      class: twMerge(checkboxClass(binding.styles.control.input), skeletonProps.class),
      disabled: !binding.control.enabled || binding.control.readonly,
      checked: booleanState.checked,
      indeterminate: booleanState.indeterminate,
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
  center={!!binding.appliedOptions.hideControlWrapper}
>
  <input
    {...inputprops}
    type="checkbox"
    class={twMerge('checkbox border-surface-400-600 border', inputprops.class)}
  />
</BooleanField>
