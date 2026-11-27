<script lang="ts">
  import InputClearButton from './components/InputClearButton.svelte';
  import {
    type ControlProps,
    useMaskControl,
    maskInputAttributes,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { Input } from '@jsonforms-svelte-shadcn-ui/input';
  import { twMerge } from 'tailwind-merge';
  import { determineClearValue, useShadcnTextControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';

  const props: ControlProps = $props();
  const clearValue = determineClearValue('');

  const { binding } = useShadcnTextControl(props, clearValue);

  const mask = useMaskControl(props, binding);

  const inputprops = $derived.by(() => {
    const shadcnProps = binding.shadcnProps('input');
    return {
      ...shadcnProps,
      type: 'text' as const,
      ...maskInputAttributes(binding, mask, shadcnProps['aria-describedby']),
      class: twMerge(
        binding.styles.control.input,
        shadcnProps.class,
        binding.clearable ? 'pe-10' : '',
      ),
    };
  });
</script>

<ControlWrapper {...mask.wrapperProps(binding.controlWrapper)}>
  <div class="group relative w-full">
    <Input {...inputprops} />
    {#if mask.showClear}
      <InputClearButton disabled={!binding.control.enabled} onclick={mask.clear} />
    {/if}
  </div>
</ControlWrapper>
