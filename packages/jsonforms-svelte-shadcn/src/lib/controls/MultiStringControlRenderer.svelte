<script lang="ts">
  import InputClearButton from './components/InputClearButton.svelte';
  import { textInputAttributes } from '@chobantonov/jsonforms-svelte-renderer-common';

  import { useTextInput, type ControlProps } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { Textarea } from '@jsonforms-svelte-shadcn-ui/textarea';
  import { determineClearValue, useShadcnTextControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';
  import { twMerge } from 'tailwind-merge';

  const props: ControlProps = $props();

  const clearValue = determineClearValue('');
  const { binding } = useShadcnTextControl(props, clearValue);
  const text = useTextInput(binding);

  const inputprops = $derived.by(() => {
    const shadcnProps = binding.shadcnProps('textarea');
    return {
      ...shadcnProps,
      ...textInputAttributes(binding, text, shadcnProps['aria-describedby']),
      maxlength: undefined,
      class: twMerge(
        'w-full',
        binding.styles.control.input,
        shadcnProps.class,
        binding.clearable ? 'pe-10' : '',
      ),
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper}>
  <div class="group relative w-full">
    <Textarea {...inputprops} value={text.value} />
    {#if text.showClear}
      <InputClearButton {...text.clearButton} multiline />
    {/if}
  </div>
</ControlWrapper>
