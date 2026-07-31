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
      oninput: (event: Event) => binding.onChange((event.currentTarget as HTMLInputElement).value),
      onfocus: binding.handleFocus,
      onblur: binding.handleBlur,
      required: binding.control.required,
      'aria-invalid': !!binding.control.errors,
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper}>
  <Input {...textInputProps}>
    {#snippet left()}
      <div class="relative h-7 w-9">
        <input
          id={`${binding.control.id}-picker`}
          type="color"
          value={pickerValue}
          disabled={!binding.control.enabled}
          aria-label={inputValue === '' ? 'Choose color; no color selected' : 'Choose color'}
          oninput={(event) => binding.onChange((event.currentTarget as HTMLInputElement).value)}
          onfocus={binding.handleFocus}
          onblur={binding.handleBlur}
          class="pointer-events-auto h-full w-full cursor-pointer rounded border border-gray-300 bg-white p-0.5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700"
        />
        {#if inputValue === ''}
          <span
            class="color-empty-swatch pointer-events-none absolute inset-0 rounded border border-gray-300 dark:border-gray-600"
            data-color-empty-swatch
            aria-hidden="true"
          ></span>
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
          class="pointer-events-auto"
          disabled={!binding.control.enabled}
          color={textInputProps.clearableColor}
          aria-label="Clear color"
          onclick={() => binding.onChange(clearValue)}
        />
      {/if}
    {/snippet}
  </Input>
</ControlWrapper>

<style>
  .color-empty-swatch {
    pointer-events: none;
    background:
      linear-gradient(
        to top right,
        transparent 45%,
        var(--color-red-500, #ef4444) 46%,
        var(--color-red-500, #ef4444) 54%,
        transparent 55%
      ),
      light-dark(var(--color-white, #fff), var(--color-gray-700, #374151));
  }

  input[type='color']:focus-visible + .color-empty-swatch {
    outline: 2px solid var(--color-primary-500, #3b82f6);
    outline-offset: 2px;
  }
</style>
