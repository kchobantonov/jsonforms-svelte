<script lang="ts">
  import InputClearButton from './components/InputClearButton.svelte';

  import {
    type ControlProps,
    usePasswordField,
    PasswordSegments,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { XIcon } from '@lucide/svelte';
  import { twMerge } from 'tailwind-merge';
  import { determineClearValue, useSkeletonTextControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';
  import PasswordToggle from './components/PasswordToggle.svelte';

  const props: ControlProps = $props();

  const clearValue = determineClearValue('');
  const { binding } = useSkeletonTextControl(props, clearValue);
  const field = usePasswordField(binding);
  const { password, text } = field;

  const inputprops = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('input');
    return {
      ...skeletonProps,
      ...field.inputAttributes(skeletonProps['aria-describedby']),
      class: twMerge(
        binding.styles.control.input,
        skeletonProps.class,
        binding.clearable ? 'pe-10' : '',
      ),
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper}>
  {#if password.segmented}
    <div class="group/otp flex min-w-0 items-center gap-2">
      <PasswordSegments {...field.segmentAttributes(inputprops['aria-describedby'])}>
        {#snippet input(attributes)}
          <input {...attributes} class="input w-10 min-w-6 shrink px-1 text-center" />
        {/snippet}
      </PasswordSegments>
      <PasswordToggle {...field.toggleProps} class="size-8" />
      {#if binding.clearable && binding.control.data}
        <button
          type="button"
          class="invisible inline-flex size-8 items-center justify-center group-focus-within/otp:visible group-hover/otp:visible"
          title={password.clearLabel}
          aria-label={password.clearLabel}
          disabled={!binding.control.enabled}
          onclick={() => {
            field.clearSegments(clearValue);
          }}><XIcon class="size-4" /></button
        >
      {/if}
    </div>
  {:else}
    <div class="group relative w-full">
      <PasswordToggle
        {...field.toggleProps}
        class="hover:preset-tonal size-8"
        style="position: absolute; inset-block: 0; inset-inline-start: 0.25rem; margin-block: auto;"
      />
      <input
        {...inputprops}
        class={twMerge('input w-full', inputprops.class)}
        style:padding-inline-start="3.25rem"
      />
      {#if field.showClear}
        <InputClearButton {...text.clearButton} label={password.clearLabel} />
      {/if}
    </div>
  {/if}
</ControlWrapper>
