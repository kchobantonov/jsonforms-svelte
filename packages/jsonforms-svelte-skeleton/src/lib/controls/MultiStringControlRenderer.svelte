<script lang="ts">
  import { useTextInput } from '@chobantonov/jsonforms-svelte';
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte';
  const message = useRendererMessages();
  import { type ControlProps, useJsonFormsControl } from '@chobantonov/jsonforms-svelte';
  import { XIcon } from '@lucide/svelte';
  import { determineClearValue, useSkeletonControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';
  import { twMerge } from 'tailwind-merge';

  const props: ControlProps = $props();

  const clearValue = determineClearValue('');
  const adaptValue = (value: unknown) => value || clearValue;

  const binding = useSkeletonControl(useJsonFormsControl(props), adaptValue);
  const text = useTextInput(binding);

  const inputprops = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('textarea');

    return {
      ...skeletonProps,
      id: `${binding.control.id}-input`,
      class: twMerge(
        'w-full',
        binding.styles.control.input,
        skeletonProps.class,
        binding.clearable ? 'pe-10' : '',
      ),
      disabled: !binding.control.enabled,
      readonly: binding.control.readonly,
      autofocus: binding.appliedOptions.focus,
      placeholder: binding.appliedOptions.placeholder,
      maxlength: undefined,
      oncompositionstart: text.oncompositionstart,
      oncompositionend: text.oncompositionend,
      oninput: text.oninput,
      onfocus: binding.handleFocus,
      onblur: text.onblur,
      required: binding.control.required,
      'aria-invalid': !!binding.control.errors,
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper}>
  <div class="group relative w-full">
    <textarea {...inputprops} class={twMerge('textarea w-full', inputprops.class)}
      >{text.value ?? ''}</textarea
    >
    {#if binding.clearable && text.value !== '' && text.value !== undefined && text.value !== null}
      <button
        type="button"
        class="hover:preset-tonal rounded-base text-surface-600-400 invisible inline-flex size-7 items-center justify-center opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 focus-visible:visible focus-visible:opacity-100"
        style="position: absolute; inset-inline-end: 0.25rem; inset-block-start: 0.75rem;"
        onmousedown={(event: MouseEvent) => event.preventDefault()}
        onclick={() => text.clear()}
        disabled={!binding.control.enabled}
        aria-label={message('control.clearValue')}
      >
        <XIcon class="size-4" />
      </button>
    {/if}
  </div>
</ControlWrapper>
