<script lang="ts">
  import { useTextInput } from '@chobantonov/jsonforms-svelte';
  import {
    type ControlProps,
    useJsonFormsControl,
    useRendererMessages,
  } from '@chobantonov/jsonforms-svelte';
  import { Textarea, CloseButton } from 'flowbite-svelte';
  import { determineClearValue, useFlowbiteControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';
  import { twMerge } from 'tailwind-merge';

  const props: ControlProps = $props();
  const message = useRendererMessages();
  let inputElement = $state<HTMLTextAreaElement>();

  const clearValue = determineClearValue('');
  const adaptValue = (value: unknown) => value || clearValue;

  const binding = useFlowbiteControl(useJsonFormsControl(props), adaptValue);
  const text = useTextInput(binding);

  const inputprops = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Textarea');

    return {
      ...flowbiteProps,

      id: `${binding.control.id}-input`,
      class: twMerge(
        binding.clearable ? 'pe-9' : '',
        'w-full',
        binding.styles.control.input,
        flowbiteProps.class,
      ),
      disabled: !binding.control.enabled,
      readonly: binding.control.readonly,
      autofocus: binding.appliedOptions.focus,
      placeholder: binding.appliedOptions.placeholder,
      value: text.value,
      clearable: binding.clearable,
      maxlength: undefined,
      oncompositionstart: text.oncompositionstart,
      oncompositionend: text.oncompositionend,
      oninput: text.oninput,
      clearableOnClick: () => {
        text.clear();
      },
      onfocus: binding.handleFocus,
      onblur: text.onblur,
      required: binding.control.required,
      'aria-invalid': !!binding.control.errors,
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper}>
  <div class="relative w-full">
    <Textarea {...inputprops} clearable={false} bind:elementRef={inputElement} />
    {#if binding.clearable && text.value !== undefined && text.value !== '' && text.value !== null}
      <CloseButton
        onmousedown={(event: MouseEvent) => event.preventDefault()}
        color="none"
        name={message('control.clearValue')}
        ariaLabel={message('control.clearValue')}
        disabled={!binding.control.enabled}
        class="absolute end-2 top-2"
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
