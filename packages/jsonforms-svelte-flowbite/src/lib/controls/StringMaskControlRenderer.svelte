<script lang="ts">
  import {
    useRendererMessages,
    type ControlProps,
    useMaskControl,
    maskInputAttributes,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { CloseButton, Input } from 'flowbite-svelte';
  import { twMerge } from 'tailwind-merge';
  import { determineClearValue, useFlowbiteTextControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';

  const props: ControlProps = $props();
  const clearValue = determineClearValue('');
  const message = useRendererMessages();
  const clearLabel = $derived(message('control.clearValue'));

  const { binding } = useFlowbiteTextControl(props, clearValue);

  const mask = useMaskControl(props, binding);

  const inputprops = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Input');
    return {
      type: 'text' as const,

      ...flowbiteProps,
      ...maskInputAttributes(binding, mask, flowbiteProps['aria-describedby']),
      class: twMerge(
        binding.clearable ? 'pe-9' : '',
        binding.styles.control.input,
        flowbiteProps.class,
      ),
    };
  });
</script>

<ControlWrapper {...mask.wrapperProps(binding.controlWrapper)}>
  <div class="group/clear w-full">
    <Input {...inputprops}>
      {#snippet right()}
        {#if mask.showClear}
          <CloseButton
            class="pointer-events-auto invisible group-focus-within/clear:visible group-hover/clear:visible focus-visible:visible"
            disabled={!binding.control.enabled}
            name={clearLabel}
            title={clearLabel}
            ariaLabel={clearLabel}
            onmousedown={(event: MouseEvent) => event.preventDefault()}
            onclick={(event: MouseEvent) => {
              event.preventDefault();
              event.stopPropagation();
              mask.clear();
            }}
            aria-label={clearLabel}
          />
        {/if}
      {/snippet}
    </Input>
  </div>
</ControlWrapper>
