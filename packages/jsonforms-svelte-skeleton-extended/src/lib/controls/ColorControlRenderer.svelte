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

    <input
      id={`${binding.control.id}-picker`}
      type="color"
      value={pickerValue}
      disabled={!binding.control.enabled}
      aria-label="Choose color"
      oninput={(event) => binding.onChange((event.currentTarget as HTMLInputElement).value)}
      onfocus={binding.handleFocus}
      onblur={binding.handleBlur}
      class="border-surface-400-600 rounded-base h-7 w-9 cursor-pointer border bg-transparent p-0.5 disabled:cursor-not-allowed disabled:opacity-50"
      style="position: absolute; inset-block: 0; inset-inline-start: 0.25rem; margin-block: auto;"
    />

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
