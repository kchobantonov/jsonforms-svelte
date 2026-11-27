<script lang="ts">
  import InputClearButton from './components/InputClearButton.svelte';
  import { untrack } from 'svelte';
  import {
    useNumericField,
    type ControlProps,
    useJsonFormsControl,
    NumericFieldFrame,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { determineClearValue, useSkeletonControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';
  import { twMerge } from 'tailwind-merge';

  const { integer, ...props }: ControlProps & { integer: boolean } = $props();

  const clearValue = determineClearValue(0);

  const binding = useSkeletonControl(useJsonFormsControl(props));
  const field = useNumericField(
    binding,
    clearValue,
    untrack(() => integer),
  );

  const { numeric } = field;

  const inputprops = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('input');
    return {
      ...skeletonProps,
      ...field.attributes(skeletonProps['aria-describedby']),
      class: twMerge(
        binding.styles.control.input,
        skeletonProps.class,
        binding.clearable ? 'pe-10' : '',
      ),
      placeholder: binding.appliedOptions.placeholder,
      value: numeric.value,
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper} errors={field.errors}>
  <NumericFieldFrame {binding} {field} {InputClearButton}>
    <input {...inputprops} class={twMerge('input w-full', inputprops.class)} />
  </NumericFieldFrame>
</ControlWrapper>
