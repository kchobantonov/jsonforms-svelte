<script lang="ts">
  import {
    DispatchRenderer,
    useJsonFormsLayout,
    useGroupState,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte';
  import type { Layout } from '@jsonforms/core';
  import { useSkeletonLayout } from '../util';
  import { ChevronDown, ChevronRight } from '@lucide/svelte';
  import type { Snippet } from 'svelte';

  const props: RendererProps<Layout> & { children?: Snippet } = $props();
  const binding = useSkeletonLayout(useJsonFormsLayout(props));
  const group = useGroupState(
    () => binding.layout,
    () => binding.appliedOptions,
  );
  const contentId = $props.id();
</script>

{#if binding.layout.visible}
  <section
    class="card preset-outlined-surface-200-800 mt-1 mb-1 min-w-full"
    {...binding.skeletonProps('card')}
  >
    {#if binding.layout.label || group.collapsible || group.hasData}
      <div class="flex items-center justify-between gap-2 px-4 py-2">
        <h3 class="text-lg font-bold">{binding.layout.label}</h3>
        <div class="flex items-center gap-2">
          {#if group.hasData}<span role="img" aria-label="Contains data" data-group-indicator
              >●</span
            >{/if}
          {#if group.collapsible}<button
              type="button"
              class="btn-icon preset-tonal"
              aria-label={binding.layout.label || 'Group'}
              aria-expanded={!group.collapsed}
              aria-controls={contentId}
              onclick={() => group.toggle()}
            >
              {#if group.collapsed}<ChevronRight size={16} />{:else}<ChevronDown size={16} />{/if}
            </button>{/if}
        </div>
      </div>
    {/if}
    <div id={contentId} hidden={group.collapsed}>
      {#each binding.layout.uischema.elements as element, index (binding.layout.path + '-' + index)}
        <div class="pr-4 pb-4 pl-4">
          <DispatchRenderer
            schema={binding.layout.schema}
            uischema={element}
            path={binding.layout.path}
            enabled={binding.layout.enabled}
            renderers={binding.layout.renderers}
            cells={binding.layout.cells}
          />
        </div>
      {/each}
      {#if props.children}
        <div class="pr-4 pb-4 pl-4">
          {@render props.children()}
        </div>
      {/if}
    </div>
  </section>
{/if}
