<script lang="ts">
  import { type ControlProps, useJsonFormsControl } from '@chobantonov/jsonforms-svelte';
  import {
    COLOR_MASKS,
    COLOR_MASK_TOKENS,
    toColorInputValue,
  } from '@chobantonov/jsonforms-svelte-extended';
  import {
    ControlWrapper,
    determineClearValue,
    useFlowbiteControl,
  } from '@chobantonov/jsonforms-svelte-flowbite';
  import { CloseButton, Input, type CloseButtonProps } from 'flowbite-svelte';
  import type { MaskInputOptions } from 'maska';
  import { maska } from 'maska/svelte';
  import { onDestroy } from 'svelte';
  import { twMerge } from 'tailwind-merge';

  const props: ControlProps = $props();
  const clearValue = determineClearValue('');
  const binding = useFlowbiteControl(useJsonFormsControl(props), (value) => value || clearValue);

  const maskOptions: MaskInputOptions = {
    mask: COLOR_MASKS,
    tokens: COLOR_MASK_TOKENS,
    tokensReplace: true,
  };

  const inputValue = $derived(typeof binding.control.data === 'string' ? binding.control.data : '');
  const pickerValue = $derived(toColorInputValue(binding.control.data));
  const pickerCommitDelay = 150;
  let pickerCommitTimer: ReturnType<typeof setTimeout> | undefined;
  let pendingPickerValue: string | undefined;

  function cancelPickerCommit() {
    if (pickerCommitTimer !== undefined) clearTimeout(pickerCommitTimer);
    pickerCommitTimer = undefined;
    pendingPickerValue = undefined;
  }

  function commitPickerValue() {
    if (pickerCommitTimer !== undefined) clearTimeout(pickerCommitTimer);
    pickerCommitTimer = undefined;
    const value = pendingPickerValue;
    pendingPickerValue = undefined;
    if (value !== undefined && value !== inputValue) binding.onChange(value);
  }

  function schedulePickerCommit(event: Event) {
    pendingPickerValue = (event.currentTarget as HTMLInputElement).value;
    if (pickerCommitTimer !== undefined) clearTimeout(pickerCommitTimer);
    pickerCommitTimer = setTimeout(commitPickerValue, pickerCommitDelay);
  }

  function handlePickerBlur() {
    commitPickerValue();
    binding.handleBlur();
  }

  function handleTextInput(event: Event) {
    cancelPickerCommit();
    binding.onChange((event.currentTarget as HTMLInputElement).value);
  }

  function clearColor() {
    cancelPickerCommit();
    binding.onChange(clearValue);
  }

  onDestroy(cancelPickerCommit);

  const textInputProps = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Input');

    return {
      clearableColor: 'none' as CloseButtonProps['color'],
      ...flowbiteProps,
      type: 'text',
      id: `${binding.control.id}-input`,
      class: twMerge(
        binding.clearable ? 'pe-9' : '',
        binding.styles.control.input,
        flowbiteProps.class,
      ),
      disabled: !binding.control.enabled,
      autofocus: binding.appliedOptions.focus,
      placeholder: binding.appliedOptions.placeholder ?? '#RRGGBB',
      value: inputValue,
      clearable: binding.clearable,
      maxlength: 9,
      oninput: handleTextInput,
      onfocus: binding.handleFocus,
      onblur: binding.handleBlur,
      required: binding.control.required,
      'aria-invalid': !!binding.control.errors,
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper}>
  <div class="color-control-group relative w-full">
    <Input {...textInputProps}>
      {#snippet left()}
        <div class="relative h-7 w-9" data-color-picker-wrapper>
          <input
            id={`${binding.control.id}-picker`}
            type="color"
            value={pickerValue}
            disabled={!binding.control.enabled}
            aria-label={inputValue === '' ? 'Choose color; no color selected' : 'Choose color'}
            oninput={schedulePickerCommit}
            onchange={schedulePickerCommit}
            onfocus={binding.handleFocus}
            onblur={handlePickerBlur}
            class="pointer-events-auto h-full w-full cursor-pointer rounded border border-gray-300 bg-white p-0.5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700"
          />
          {#if inputValue === ''}
            <span
              class="color-empty-swatch pointer-events-none absolute inset-0 rounded border border-gray-300 dark:border-gray-600"
              data-color-empty-swatch
              aria-hidden="true"
              ><svg
                class="block h-full w-full"
                viewBox="0 0 32 24"
                preserveAspectRatio="none"
                shape-rendering="crispEdges"
                data-color-empty-pattern
              >
                <rect class="color-empty-base" width="32" height="24" />
                <path
                  class="color-empty-check"
                  d="M0 0h8v8H0zM16 0h8v8h-8zM8 8h8v8H8zM24 8h8v8h-8zM0 16h8v8H0zM16 16h8v8h-8z"
                />
              </svg></span
            >
          {/if}
        </div>
      {/snippet}
      {#snippet children(inputProps)}
        <input
          {...inputProps}
          style={`${inputProps.style ?? ''}; padding-inline-start: 3rem;`}
          value={textInputProps.value}
          oninput={textInputProps.oninput}
          onfocus={textInputProps.onfocus}
          onblur={textInputProps.onblur}
          use:maska={maskOptions}
        />
      {/snippet}
      {#snippet right()}
        {#if textInputProps.value !== '' && textInputProps.clearable}
          <CloseButton
            class="color-clear-button pointer-events-auto"
            disabled={!binding.control.enabled}
            color={textInputProps.clearableColor}
            ariaLabel="Clear color"
            onmousedown={(event: MouseEvent) => event.preventDefault()}
            onclick={clearColor}
          />
        {/if}
      {/snippet}
    </Input>
  </div>
</ControlWrapper>

<style>
  .color-empty-swatch {
    pointer-events: none;
  }

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

  .color-empty-base {
    fill: light-dark(var(--color-white, #ffffff), var(--color-gray-800, #1f2937));
  }

  .color-empty-check {
    fill: light-dark(var(--color-gray-300, #d1d5db), var(--color-gray-500, #6b7280));
    opacity: 0.88;
  }

  input[type='color']:focus-visible + .color-empty-swatch {
    outline: 2px solid var(--color-primary-500, #3b82f6);
    outline-offset: 2px;
  }
</style>
