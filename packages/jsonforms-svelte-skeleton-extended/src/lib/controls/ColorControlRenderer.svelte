<script lang="ts">
  import TooltipClearButton from './TooltipClearButton.svelte';

  import ColorPicker from './components/ColorPicker.svelte';
  import {
    type ControlProps,
    useJsonFormsControl,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { ColorError, useColorEditor } from '@chobantonov/jsonforms-svelte-extended';
  import {
    ControlWrapper,
    determineClearValue,
    useSkeletonControl,
  } from '@chobantonov/jsonforms-svelte-skeleton';
  import { twMerge } from 'tailwind-merge';

  const props: ControlProps = $props();
  const clearValue = determineClearValue('');
  const binding = useSkeletonControl(useJsonFormsControl(props), (value) => value || clearValue);

  const editor = useColorEditor(binding, clearValue);
  const textInputProps = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('input');

    return {
      ...skeletonProps,
      ...editor.inputProps(binding, skeletonProps['aria-describedby']),
      class: twMerge(
        'input w-full',
        binding.styles.control.input,
        skeletonProps.class,
        'ps-12',
        binding.clearable ? 'pe-10' : '',
      ),
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper}>
  <div class={editor.profile.textEntry ? 'group relative w-full' : 'group relative h-9 w-24'}>
    {#if editor.profile.textEntry}<input {...textInputProps} />{/if}

    <div
      class="h-7 w-9"
      style="position: absolute; inset-block: 0; inset-inline-start: 0.25rem; margin-block: auto;"
      data-color-picker-wrapper
    >
      <ColorPicker
        {...editor.pickerProps(
          binding.clearable,
          binding.handleFocus,
          textInputProps['aria-describedby'],
        )}
      />
    </div>

    {#if textInputProps.value !== '' && binding.clearable}
      <TooltipClearButton
        class="hover:preset-tonal rounded-base text-surface-600-400 invisible absolute inset-y-0 end-1 my-auto inline-flex size-7 items-center justify-center opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 focus-visible:visible focus-visible:opacity-100"
        disabled={!binding.control.enabled}
        onmousedown={(event: MouseEvent) => event.preventDefault()}
        onclick={editor.clearColor}
        label={editor.message('clear')}
      />
    {/if}
  </div>
  <ColorError {editor} id={binding.control.id} />
</ControlWrapper>
