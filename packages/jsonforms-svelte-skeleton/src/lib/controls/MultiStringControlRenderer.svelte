<script lang="ts">
  import InputClearButton from './components/InputClearButton.svelte';
  import { textInputAttributes } from '@chobantonov/jsonforms-svelte-renderer-common';

  import { useTextInput, type ControlProps } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { determineClearValue, useSkeletonTextControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';
  import { twMerge } from 'tailwind-merge';

  const props: ControlProps = $props();

  const clearValue = determineClearValue('');
  const { binding } = useSkeletonTextControl(props, clearValue);
  const text = useTextInput(binding);

  const inputprops = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('textarea');
    return {
      ...skeletonProps,
      ...textInputAttributes(binding, text, skeletonProps['aria-describedby']),
      maxlength: undefined,
      class: twMerge(
        'w-full',
        binding.styles.control.input,
        skeletonProps.class,
        binding.clearable ? 'pe-10' : '',
      ),
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper}>
  <div class="group relative w-full">
    <textarea {...inputprops} class={twMerge('textarea w-full', inputprops.class)}
      >{text.value ?? ''}</textarea
    >
    {#if text.showClear}
      <InputClearButton {...text.clearButton} multiline />
    {/if}
  </div>
</ControlWrapper>
