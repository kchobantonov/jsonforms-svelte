<script lang="ts">
  import { textInputAttributes } from '@chobantonov/jsonforms-svelte-renderer-common';

  import {
    useTextInput,
    type ControlProps,
    useRendererMessages,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { Textarea, CloseButton } from 'flowbite-svelte';
  import { determineClearValue, useFlowbiteTextControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';
  import { twMerge } from 'tailwind-merge';

  const props: ControlProps = $props();
  const message = useRendererMessages();
  let inputElement = $state<HTMLTextAreaElement>();

  const clearValue = determineClearValue('');
  const { binding } = useFlowbiteTextControl(props, clearValue);
  const text = useTextInput(binding);

  const inputprops = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Textarea');
    return {
      ...flowbiteProps,

      ...textInputAttributes(binding, text, flowbiteProps['aria-describedby']),
      maxlength: undefined,
      class: twMerge(
        binding.clearable ? 'pe-9' : '',
        'w-full',
        binding.styles.control.input,
        flowbiteProps.class,
      ),
      value: text.value,
      clearable: binding.clearable,
      clearableOnClick: () => {
        text.clear();
      },
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper}>
  <div class="group/clear relative w-full">
    <Textarea {...inputprops} clearable={false} bind:elementRef={inputElement} />
    {#if text.showClear}
      <CloseButton
        onmousedown={(event: MouseEvent) => event.preventDefault()}
        color="none"
        name={message('control.clearValue')}
        title={message('control.clearValue')}
        ariaLabel={message('control.clearValue')}
        disabled={!binding.control.enabled}
        class="invisible absolute end-2 top-2 group-focus-within/clear:visible group-hover/clear:visible focus-visible:visible"
        onclick={(event: MouseEvent) => {
          event.preventDefault();
          event.stopPropagation();
          if (!binding.control.enabled) return;
          text.clear();
          inputElement?.focus({ preventScroll: true });
        }}
      />
    {/if}
  </div>
</ControlWrapper>
