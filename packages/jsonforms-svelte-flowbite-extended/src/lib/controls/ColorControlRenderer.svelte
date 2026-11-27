<script lang="ts">
  import ColorPicker from './components/ColorPicker.svelte';
  import {
    type ControlProps,
    useJsonFormsControl,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { ColorError, useColorEditor } from '@chobantonov/jsonforms-svelte-extended';
  import {
    ControlWrapper,
    determineClearValue,
    useFlowbiteControl,
  } from '@chobantonov/jsonforms-svelte-flowbite';
  import { CloseButton, Input, Tooltip, type CloseButtonProps } from 'flowbite-svelte';
  import { twMerge } from 'tailwind-merge';

  const props: ControlProps = $props();
  const clearValue = determineClearValue('');
  const binding = useFlowbiteControl(useJsonFormsControl(props), (value) => value || clearValue);

  const editor = useColorEditor(binding, clearValue);
  const textInputProps = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Input');

    return {
      clearableColor: 'none' as CloseButtonProps['color'],
      ...flowbiteProps,
      ...editor.inputProps(binding, flowbiteProps['aria-describedby']),
      class: twMerge(
        binding.clearable ? 'pe-9' : '',
        binding.styles.control.input,
        flowbiteProps.class,
      ),
      clearable: binding.clearable,
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper}>
  <div
    class={editor.profile.textEntry
      ? 'color-control-group relative w-full'
      : 'color-control-group relative w-24'}
  >
    <Input {...textInputProps} classes={{ right: 'pointer-events-none' }}>
      {#snippet left()}
        <div class="relative z-10 h-7 w-9" data-color-picker-wrapper>
          <ColorPicker
            {...editor.pickerProps(
              binding.clearable,
              binding.handleFocus,
              textInputProps['aria-describedby'],
            )}
          />
        </div>
      {/snippet}
      {#snippet children(inputProps)}
        {#if editor.profile.textEntry}
          <input
            {...inputProps}
            style={`${inputProps.style ?? ''}; padding-inline-start: 3rem;`}
            value={textInputProps.value}
            oninput={textInputProps.oninput}
            onfocus={textInputProps.onfocus}
            onblur={textInputProps.onblur}
          />
        {:else}<div class="h-9 min-w-0"></div>{/if}
      {/snippet}
      {#snippet right()}
        {#if textInputProps.value !== '' && textInputProps.clearable}
          <CloseButton
            class="color-clear-button pointer-events-auto"
            disabled={!binding.control.enabled}
            color={textInputProps.clearableColor}
            ariaLabel={editor.message('clear')}
            onmousedown={(event: MouseEvent) => event.preventDefault()}
            onclick={editor.clearColor}
          />
          <Tooltip>{editor.message('clear')}</Tooltip>
        {/if}
      {/snippet}
    </Input>
  </div>
  <ColorError {editor} id={binding.control.id} />
</ControlWrapper>

<style>
  .color-control-group :global(.color-clear-button) {
    visibility: hidden;
    opacity: 0;
    transition: opacity 150ms ease;
  }

  .color-control-group:hover :global(.color-clear-button),
  .color-control-group:focus-within :global(.color-clear-button),
  .color-control-group :global(.color-clear-button:focus-visible) {
    visibility: visible;
    opacity: 1;
  }
</style>
