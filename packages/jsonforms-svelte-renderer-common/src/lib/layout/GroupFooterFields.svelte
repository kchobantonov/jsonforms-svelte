<script lang="ts">
  import type { useJsonFormsLayout } from '../core/jsonFormsCompositions.svelte';
  type BoundLayout = ReturnType<typeof useJsonFormsLayout>['layout'];
  import type { UISchemaElement } from '@jsonforms/core';
  import LayoutChild from './LayoutChild.svelte';
  const {
    layout,
    elements,
    framed = false,
  }: { layout: BoundLayout; elements: UISchemaElement[]; framed?: boolean } = $props();
</script>

{#snippet fields()}
  {#each elements as element, index (index)}
    <span class={element.options?.fullWidth ? 'w-full' : 'inline-flex w-auto flex-none'}>
      <LayoutChild {layout} uischema={element} />
    </span>
  {/each}
{/snippet}
{#if framed}<footer data-group-footer class="flex flex-wrap items-center gap-2 px-4 pt-4 pb-4">
    {@render fields()}
  </footer>{:else}{@render fields()}{/if}
