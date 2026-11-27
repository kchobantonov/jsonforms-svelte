<script lang="ts">
  import type { Snippet } from 'svelte';
  import DispatchRenderer from '../core/DispatchRenderer.svelte';
  import type { useMixedTreeView } from './mixedTreeView.svelte';
  const {
    view,
    binding,
    selector,
    wrapper,
    viewButton,
    rowClass = 'flex flex-row items-start',
    selectorClass = 'min-w-32 shrink-0',
    valueClass = 'flex-1',
    labelPadding,
  }: {
    view: ReturnType<typeof useMixedTreeView>;
    binding: Parameters<typeof useMixedTreeView>[1] & { handleFocus(): void; handleBlur(): void };
    selector: Snippet;
    wrapper: Snippet<[Snippet]>;
    viewButton: Snippet;
    rowClass?: string;
    selectorClass?: string;
    valueClass?: string;
    labelPadding: string;
  } = $props();
  const { schema, uischema, booleanUiSchema, inputDataType, nullable } = $derived(view.editor);
  const showValue = $derived(schema && uischema && !(nullable && binding.control.data === null));
</script>

{#snippet dispatch(ui: NonNullable<typeof uischema>)}
  {#if schema}
    <DispatchRenderer
      {schema}
      uischema={ui}
      path={binding.control.path}
      renderers={binding.control.renderers}
      cells={binding.control.cells}
      enabled={binding.control.enabled}
    />
  {/if}
{/snippet}
{#snippet nestedRow()}
  <div class="flex items-center gap-2">
    <div class="min-w-32 shrink-0">{@render selector()}</div>
    {@render viewButton()}
  </div>
{/snippet}
{#snippet booleanRow()}
  <div
    class="flex items-center gap-2"
    data-mixed-boolean-row
    onfocusin={binding.handleFocus}
    onfocusout={binding.handleBlur}
  >
    <div class="min-w-32 shrink-0">{@render selector()}</div>
    {#if booleanUiSchema}{@render dispatch(booleanUiSchema)}{/if}
  </div>
{/snippet}

{#if view.isSelectedComplexType}
  <div class="flex flex-col gap-4">
    {#if !view.isTreeRootDetail}<div class="w-full">{@render wrapper(selector)}</div>{/if}
    {#if uischema}{@render dispatch(uischema)}{/if}
  </div>
{:else if view.isNestedComplexType}
  <div class="w-full">{@render wrapper(nestedRow)}</div>
{:else if inputDataType === 'boolean' && schema && booleanUiSchema}
  {@render wrapper(booleanRow)}
{:else}
  <div class={rowClass}>
    <div class={showValue ? selectorClass : 'w-full'}>{@render wrapper(selector)}</div>
    {#if showValue && uischema}
      <div
        class={valueClass}
        class:mixed-primitive-sr-label={view.navigation.hideRepeatedLabel}
        style:--mixed-label-padding={labelPadding}
      >
        {@render dispatch(uischema)}
      </div>
    {/if}
  </div>
{/if}

<style>
  .mixed-primitive-sr-label {
    padding-top: var(--mixed-label-padding);
  }
  .mixed-primitive-sr-label :global(label) {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
