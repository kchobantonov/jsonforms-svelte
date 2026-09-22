<script lang="ts">
  import {
    NumericValueHint,
    type ControlProps,
    useJsonFormsControl,
  } from '@chobantonov/jsonforms-svelte';
  import { XIcon } from '@lucide/svelte';
  import { determineClearValue, useSkeletonControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';
  import { twMerge } from 'tailwind-merge';

  const props: ControlProps = $props();

  const clearValue = determineClearValue(0);

  const adaptValue = (value: any) =>
    value === '' || value === null || value === undefined ? clearValue : parseInt(value, 10);
  const binding = useSkeletonControl(useJsonFormsControl(props), adaptValue);

  const handleIntegerKeyDown = (event: KeyboardEvent) => {
    // Disallow decimal/exponent notation for integer-only input.
    if (event.key === '.' || event.key === ',' || event.key === 'e' || event.key === 'E') {
      event.preventDefault();
    }
  };

  const handleIntegerPaste = (event: ClipboardEvent) => {
    const pasted = event.clipboardData?.getData('text')?.trim() ?? '';
    if (pasted.length === 0) return;
    if (!/^[+-]?\d+$/.test(pasted)) {
      event.preventDefault();
    }
  };

  const incompatibleValue = $derived(
    binding.control.data !== undefined &&
      binding.control.data !== null &&
      typeof binding.control.data !== 'number',
  );
  const hintId = $derived(`${binding.control.id}-incompatible-value`);

  const inputprops = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('input');

    return {
      ...skeletonProps,
      type: 'number',
      step: binding.appliedOptions.step ?? binding.control.schema.multipleOf ?? 1,
      min: binding.control.schema.minimum,
      max: binding.control.schema.maximum,
      id: `${binding.control.id}-input`,
      class: twMerge(
        binding.styles.control.input,
        skeletonProps.class,
        binding.clearable ? 'pe-10' : '',
      ),
      disabled: !binding.control.enabled,
      autofocus: binding.appliedOptions.focus,
      placeholder: binding.appliedOptions.placeholder,
      value: binding.control.data,
      'aria-describedby': incompatibleValue ? hintId : undefined,
      oninput: (e: Event) => binding.onChange((e.target as HTMLInputElement).value),
      onkeydown: handleIntegerKeyDown,
      onpaste: handleIntegerPaste,
      onfocus: binding.handleFocus,
      onblur: binding.handleBlur,
      required: binding.control.required,
      'aria-invalid': !!binding.control.errors,
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper}>
  <div class="flex min-w-0 items-center gap-1">
    <div class="group relative min-w-0 flex-1">
      <input {...inputprops} class={twMerge('input w-full', inputprops.class)} />
      {#if binding.clearable && (incompatibleValue || (inputprops.value !== '' && inputprops.value !== undefined && inputprops.value !== null))}
        <button
          type="button"
          class="hover:preset-tonal rounded-base text-surface-600-400 invisible inline-flex size-7 items-center justify-center opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 focus-visible:visible focus-visible:opacity-100"
          style="position: absolute; inset-block: 0; inset-inline-end: 0.25rem; margin-block: auto;"
          onmousedown={(event: MouseEvent) => event.preventDefault()}
          onclick={() => binding.onChange(clearValue)}
          disabled={!binding.control.enabled}
          aria-label="Clear value"
        >
          <XIcon class="size-4" />
        </button>
      {/if}
    </div>
    {#if incompatibleValue}<NumericValueHint id={hintId} value={binding.control.data} />{/if}
  </div>
</ControlWrapper>
