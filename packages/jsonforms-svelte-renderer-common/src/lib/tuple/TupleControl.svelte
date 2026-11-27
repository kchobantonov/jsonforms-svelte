<script lang="ts">
  import TupleFields from './TupleFields.svelte';
  import type { ControlProps } from '../core/jsonFormsCompositions.svelte';
  const {
    binding,
    rendererProps,
    borderClass,
    errorClass,
    hintClass,
  }: {
    binding: {
      control: { id: string; visible: boolean };
      controlWrapper: {
        label?: string;
        errors?: string;
        required?: boolean;
        description?: string;
        isFocused?: boolean;
        persistentHint?: boolean;
      };
      appliedOptions: Record<string, unknown>;
    };
    rendererProps: ControlProps;
    borderClass: string;
    errorClass: string;
    hintClass: string;
  } = $props();
  const wrapper = $derived(binding.controlWrapper);
  const showBorder = $derived(binding.appliedOptions.showBorder !== false);
</script>

{#if binding.control.visible}
  <section
    data-tuple-control
    class={`tuple-control ${borderClass}`}
    class:tuple-bordered={showBorder}
    aria-labelledby={wrapper.label ? binding.control.id + '-heading' : undefined}
  >
    {#if wrapper.label}
      <h3
        id={binding.control.id + '-heading'}
        data-tuple-heading
        data-invalid={!!wrapper.errors}
        class={wrapper.errors ? errorClass : ''}
      >
        {wrapper.label}{#if wrapper.required && !binding.appliedOptions.hideRequiredAsterisk}<span
            class={errorClass}
            aria-hidden="true"
          >
            *</span
          >{/if}
      </h3>
    {/if}
    <TupleFields {...rendererProps} />
    {#if wrapper.errors}
      <p role="alert" class={`${errorClass} text-xs`}>{wrapper.errors}</p>
    {:else if wrapper.description && (wrapper.isFocused || wrapper.persistentHint)}
      <p role="note" class={`${hintClass} text-xs`}>{wrapper.description}</p>
    {/if}
  </section>
{/if}

<style>
  .tuple-control {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .tuple-bordered {
    border-width: 1px;
    border-style: solid;
    border-radius: 0.5rem;
    padding: 1rem;
  }
  h3 {
    font-size: 0.875rem;
    font-weight: 600;
  }
</style>
