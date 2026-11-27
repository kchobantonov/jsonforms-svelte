<script lang="ts">
  import type { Component } from 'svelte';
  import type { SectionIndicatorProps } from './sectionIndicators.svelte';
  const {
    category,
    layout,
    SectionIndicators,
    class: className,
  }: {
    category: { label?: string; uischema: SectionIndicatorProps['uischema'] };
    layout: Pick<SectionIndicatorProps, 'path' | 'pathSegments'>;
    SectionIndicators: Component<SectionIndicatorProps>;
    class?: string;
  } = $props();
</script>

{#if className}
  <span class={className}
    ><span>{category.label}</span><SectionIndicators
      class="ms-auto"
      uischema={category.uischema}
      path={layout.path}
      pathSegments={layout.pathSegments}
    /></span
  >
{:else}
  {category.label}<SectionIndicators
    uischema={category.uischema}
    path={layout.path}
    pathSegments={layout.pathSegments}
  />
{/if}
