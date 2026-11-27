<script lang="ts">
  import type { useJsonFormsLayout } from '../core/jsonFormsCompositions.svelte';
  type BoundLayout = ReturnType<typeof useJsonFormsLayout>['layout'];
  import type { UISchemaElement } from '@jsonforms/core';
  import LayoutChild from './LayoutChild.svelte';
  const { layout, elements }: { layout: BoundLayout; elements: UISchemaElement[] } = $props();
</script>

<div data-group-header class="grid min-w-0 gap-1">
  {#each elements as element, index (index)}
    <div class={index === 0 ? 'group-header-title' : 'group-header-detail'}>
      <LayoutChild {layout} uischema={element} />
    </div>
  {/each}
</div>

<style>
  .group-header-title :global(p) {
    font-size: var(--group-title-size, 1.125rem);
    font-weight: var(--group-title-weight, 700);
  }
  .group-header-detail :global(p) {
    font-size: 0.875rem;
    font-weight: 400;
    color: var(--group-detail-color, inherit);
    opacity: var(--group-detail-opacity, 1);
  }
</style>
