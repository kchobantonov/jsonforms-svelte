<script lang="ts">
  import { useTextInput, useJsonForms, stringSuggestions } from '@chobantonov/jsonforms-svelte';
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
  const form = useJsonForms();
  const suggestions = $derived(stringSuggestions(binding.control.schema, form.core?.schema) ?? []);

  const text = useTextInput(binding, 0);
  const datalistId = $derived(`${binding.control.id}-suggestions`);

  const inputprops = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('input');

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
      autofocus: binding.appliedOptions.focus,
      placeholder: binding.appliedOptions.placeholder,
      value: text.value,
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
    <datalist id={datalistId}>
      {#each suggestions ?? [] as suggestion (String(suggestion))}
        <option value={suggestion}></option>
      {/each}
    </datalist>
  </div>
</ControlWrapper>
