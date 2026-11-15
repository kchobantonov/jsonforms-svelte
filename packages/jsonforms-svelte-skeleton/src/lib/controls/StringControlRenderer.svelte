<script lang="ts">
  import { useTextInput } from '@chobantonov/jsonforms-svelte';
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte';
  const message = useRendererMessages();
  import { type ControlProps, useJsonFormsControl } from '@chobantonov/jsonforms-svelte';
  import { XIcon } from '@lucide/svelte';
  import { twMerge } from 'tailwind-merge';
  import { determineClearValue, useSkeletonControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';
  import MultiStringControlRenderer from './MultiStringControlRenderer.svelte';

  const props: ControlProps = $props();

  const clearValue = determineClearValue('');
  const adaptValue = (value: unknown) => value || clearValue;

  const binding = useSkeletonControl(useJsonFormsControl(props), adaptValue);

  // Suggestions from the merged flat config and local control options.
  const suggestions = $derived.by(() => {
    const sug = binding.appliedOptions.suggestion;
    if (sug === undefined || !Array.isArray(sug) || !sug.every((s) => typeof s === 'string')) {
      return undefined;
    }
    return sug as string[];
  });

  const text = useTextInput(binding);
  const datalistId = $derived.by(() =>
    suggestions && suggestions.length > 0 ? `${binding.control.id}-suggestions` : undefined,
  );

  const inputprops = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('input');
    const helpVisible =
      !binding.appliedOptions.hideControlWrapper &&
      (!!binding.control.errors?.trim() ||
        (!!binding.control.description &&
          (binding.isFocused || binding.controlWrapper.persistentHint)));
    const describedBy = [
      skeletonProps['aria-describedby'],
      helpVisible ? `${binding.control.id}-help` : undefined,
    ]
      .filter((value): value is string => typeof value === 'string' && value.length > 0)
      .join(' ');

    return {
      ...skeletonProps,
      type: 'text',
      id: `${binding.control.id}-input`,
      class: twMerge(
        binding.styles.control.input,
        skeletonProps.class,
        binding.clearable ? 'pe-10' : '',
      ),
      disabled: !binding.control.enabled,
      readonly: binding.control.readonly,
      autofocus: binding.initialFocus,
      placeholder: binding.appliedOptions.placeholder,
      value: text.value,
      maxlength: undefined,
      oncompositionstart: text.oncompositionstart,
      oncompositionend: text.oncompositionend,
      oninput: text.oninput,
      onfocus: binding.handleFocus,
      onblur: text.onblur,
      required: binding.control.required,
      'aria-describedby': describedBy || undefined,
      'aria-invalid': !!binding.control.errors,
    };
  });
</script>

{#if binding.appliedOptions.multi === true}
  <MultiStringControlRenderer {...props} />
{:else}
  <ControlWrapper {...binding.controlWrapper}>
    <div class="group relative w-full">
      <input {...inputprops} list={datalistId} class={twMerge('input w-full', inputprops.class)} />
      {#if binding.clearable && inputprops.value !== '' && inputprops.value !== undefined && inputprops.value !== null}
        <button
          type="button"
          class="hover:preset-tonal rounded-base text-surface-600-400 invisible inline-flex size-7 items-center justify-center opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 focus-visible:visible focus-visible:opacity-100"
          style="position: absolute; inset-block: 0; inset-inline-end: 0.25rem; margin-block: auto;"
          onmousedown={(event: MouseEvent) => event.preventDefault()}
          onclick={() => text.clear()}
          disabled={!binding.control.enabled}
          aria-label={message('control.clearValue')}
        >
          <XIcon class="size-4" />
        </button>
      {/if}
      {#if datalistId}
        <datalist id={datalistId}>
          {#each suggestions ?? [] as suggestion (suggestion)}
            <option value={suggestion}></option>
          {/each}
        </datalist>
      {/if}
    </div>
  </ControlWrapper>
{/if}
