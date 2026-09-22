<script lang="ts">
  import {
    TupleFields,
    TuplePresentationSymbol,
    useJsonFormsControl,
    type ControlProps,
  } from '@chobantonov/jsonforms-svelte';
  import { useShadcnControl, setIsDynamicProperty } from '../util';
  import { setContext } from 'svelte';
  import Dialog from '../components/DetailDialog.svelte';
  import AdditionalItems from './components/AdditionalItems.svelte';
  import Action from '../components/TupleAction.svelte';
  setContext(TuplePresentationSymbol, { Dialog, Action, AdditionalItems });
  const props: ControlProps = $props();
  const binding = useShadcnControl(useJsonFormsControl(props));
  // TupleField owns clearing; primitive controls must not invent a numeric zero.
  setIsDynamicProperty(false);
  const wrapper = $derived(binding.controlWrapper);
  const showBorder = $derived(binding.appliedOptions.showBorder !== false);
</script>

{#if binding.control.visible}
  <section
    data-tuple-control
    class="tuple-control border-border"
    class:tuple-bordered={showBorder}
    aria-labelledby={wrapper.label ? binding.control.id + '-heading' : undefined}
  >
    {#if wrapper.label}
      <h3
        id={binding.control.id + '-heading'}
        data-tuple-heading
        data-invalid={!!wrapper.errors}
        class={wrapper.errors ? 'text-destructive' : ''}
      >
        {wrapper.label}{#if wrapper.required && !binding.appliedOptions.hideRequiredAsterisk}<span
            class="text-destructive"
            aria-hidden="true"
          >
            *</span
          >{/if}
      </h3>
    {/if}
    <TupleFields {...props} />
    {#if wrapper.errors}
      <p role="alert" class="text-destructive text-xs">{wrapper.errors}</p>
    {:else if wrapper.description && (wrapper.isFocused || wrapper.persistentHint)}
      <p role="note" class="text-muted-foreground text-xs">{wrapper.description}</p>
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
