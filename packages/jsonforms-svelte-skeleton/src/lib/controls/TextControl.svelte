<script lang="ts">
  import InputClearButton from './components/InputClearButton.svelte';
  import { textInputAttributes } from '@chobantonov/jsonforms-svelte-renderer-common';

  import {
    useSuggestedTextInput,
    SuggestedTextField,
    type ControlProps,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { twMerge } from 'tailwind-merge';
  import { determineClearValue, useSkeletonTextControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';
  import MultiStringControlRenderer from './MultiStringControlRenderer.svelte';

  const { schemaSuggestions, ...props }: ControlProps & { schemaSuggestions: boolean } = $props();

  const clearValue = determineClearValue('');
  const { binding } = useSkeletonTextControl(props, clearValue);

  const field = useSuggestedTextInput(binding, () => schemaSuggestions);
  const { text } = field;

  const inputprops = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('input');
    return {
      ...skeletonProps,
      type: 'text',
      ...textInputAttributes(binding, text, skeletonProps['aria-describedby']),
      maxlength: undefined,
      class: twMerge(
        binding.styles.control.input,
        skeletonProps.class,
        binding.clearable ? 'pe-10' : '',
      ),
      value: text.value,
    };
  });
</script>

<SuggestedTextField
  {field}
  {...field.fieldProps(props, binding.controlWrapper)}
  {ControlWrapper}
  {MultiStringControlRenderer}
  {InputClearButton}
>
  <input
    {...inputprops}
    list={field.datalistId}
    class={twMerge('input w-full', inputprops.class)}
  />
</SuggestedTextField>
