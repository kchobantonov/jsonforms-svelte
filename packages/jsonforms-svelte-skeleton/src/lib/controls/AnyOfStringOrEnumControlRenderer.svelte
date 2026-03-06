<script lang="ts">
  import { type ControlProps, useJsonFormsControl } from '@chobantonov/jsonforms-svelte';
  import { XIcon } from '@lucide/svelte';
  import { determineClearValue, useSkeletonControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';
  import { twMerge } from 'tailwind-merge';
  import type { JsonSchema } from '@jsonforms/core';

  const props: ControlProps = $props();

  const clearValue = determineClearValue('');
  const adaptValue = (value: any) => value || clearValue;

  const findEnumSchema = (schemas: JsonSchema[]) =>
    schemas.find((s) => s.enum !== undefined && (s.type === 'string' || s.type === undefined));

  // Suggestions for combobox/select
  const suggestions = $derived.by(() => {
    return findEnumSchema(binding.control.schema.anyOf!)!.enum!;
  });

  const binding = useSkeletonControl(useJsonFormsControl(props), adaptValue);
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
      autofocus: binding.appliedOptions.focus,
      placeholder: binding.appliedOptions.placeholder,
      value: binding.control.data,
      maxlength: binding.appliedOptions.restrict ? props.schema.maxLength : undefined,
      oninput: (e: Event) => binding.onChange((e.target as HTMLInputElement).value),
      onfocus: binding.handleFocus,
      onblur: binding.handleBlur,
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
        class="hover:preset-tonal invisible inline-flex size-7 items-center justify-center rounded-base text-surface-600-400 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 focus-visible:visible focus-visible:opacity-100"
        style="position: absolute; inset-block: 0; inset-inline-end: 0.25rem; margin-block: auto;"
        onmousedown={(event: MouseEvent) => event.preventDefault()}
        onclick={() => binding.onChange(clearValue)}
        disabled={!binding.control.enabled}
        aria-label="Clear value"
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
