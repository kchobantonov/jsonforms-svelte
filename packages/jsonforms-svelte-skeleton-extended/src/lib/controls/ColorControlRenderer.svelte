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
    useSkeletonControl,
  } from '@chobantonov/jsonforms-svelte-skeleton';
  import { XIcon } from '@lucide/svelte';
  import type { MaskInputOptions } from 'maska';
  import { maska } from 'maska/svelte';
  import { twMerge } from 'tailwind-merge';

  const props: ControlProps = $props();
  const clearValue = determineClearValue('');
  const binding = useSkeletonControl(useJsonFormsControl(props), (value) => value || clearValue);

  const maskOptions: MaskInputOptions = {
    mask: COLOR_MASKS,
    tokens: COLOR_MASK_TOKENS,
    tokensReplace: true,
  };

  const inputValue = $derived(typeof binding.control.data === 'string' ? binding.control.data : '');
  const pickerValue = $derived(toColorInputValue(binding.control.data));

  const textInputProps = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('input');

    return {
      ...skeletonProps,
      type: 'text',
      id: `${binding.control.id}-input`,
      class: twMerge(
        'input w-full',
        binding.styles.control.input,
        skeletonProps.class,
        'ps-12',
        binding.clearable ? 'pe-10' : '',
      ),
      disabled: !binding.control.enabled,
      autofocus: binding.appliedOptions.focus,
      placeholder: binding.appliedOptions.placeholder ?? '#RRGGBB',
      value: inputValue,
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
  <div class="group relative w-full">
    <input {...textInputProps} use:maska={maskOptions} />

    <div
      class="h-7 w-9"
      style="position: absolute; inset-block: 0; inset-inline-start: 0.25rem; margin-block: auto;"
      data-color-picker-wrapper
    >
      <input
        id={`${binding.control.id}-picker`}
        type="color"
        value={pickerValue}
        disabled={!binding.control.enabled}
        aria-label={inputValue === '' ? 'Choose color; no color selected' : 'Choose color'}
        oninput={(event) => binding.onChange((event.currentTarget as HTMLInputElement).value)}
        onfocus={binding.handleFocus}
        onblur={binding.handleBlur}
        class="border-surface-400-600 rounded-base h-full w-full cursor-pointer border bg-transparent p-0.5 disabled:cursor-not-allowed disabled:opacity-50"
      />
      {#if inputValue === ''}
        <span
          class="color-empty-swatch border-surface-400-600 rounded-base pointer-events-none absolute inset-0 border"
          data-color-empty-swatch
          aria-hidden="true"
        >
          <svg
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
          </svg>
        </span>
      {/if}
    </div>

    {#if textInputProps.value !== '' && binding.clearable}
      <button
        type="button"
        class="hover:preset-tonal rounded-base text-surface-600-400 invisible absolute inset-y-0 end-1 my-auto inline-flex size-7 items-center justify-center opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 focus-visible:visible focus-visible:opacity-100"
        disabled={!binding.control.enabled}
        onmousedown={(event: MouseEvent) => event.preventDefault()}
        onclick={() => binding.onChange(clearValue)}
        aria-label="Clear color"
      >
        <XIcon class="size-4" />
      </button>
    {/if}
  </div>
</ControlWrapper>

<style>
  .color-empty-swatch {
    pointer-events: none;
  }

  .color-empty-base {
    fill: var(--color-surface-50-950, light-dark(#ffffff, #111827));
  }

  .color-empty-check {
    fill: var(--color-surface-400-600, light-dark(#94a3b8, #64748b));
    opacity: 0.58;
  }

  input[type='color']:focus-visible + .color-empty-swatch {
    outline: 2px solid var(--color-primary-500, #6366f1);
    outline-offset: 2px;
  }
</style>
