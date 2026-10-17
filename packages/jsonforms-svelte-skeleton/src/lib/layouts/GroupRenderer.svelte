<script lang="ts">
  import SectionIndicators from './SectionIndicators.svelte';
  import {
    useJsonFormsLayout,
    useGroupState,
    useObjectErrors,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte';
  import type { Layout } from '@jsonforms/core';
  import LayoutRenderer from './LayoutRenderer.svelte';
  import { useSkeletonLayout, getPortalRootNodeGetter } from '../util';
  import { ChevronDown, ChevronRight } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import { Collapsible } from '@skeletonlabs/skeleton-svelte';

  // Retain the existing public snippet prop for consumer compatibility.
  // eslint-disable-next-line svelte/no-unused-props
  const props: RendererProps<Layout> & { children?: Snippet } = $props();
  const binding = useSkeletonLayout(useJsonFormsLayout(props));
  const group = useGroupState(() => binding.layout);
  const objectErrors = useObjectErrors(() => binding.layout);
  const contentId = $props.id();
  const getRootNode = getPortalRootNodeGetter();
</script>

{#snippet heading()}
  <span class="text-lg font-bold">{binding.layout.label}</span>
  <span class="flex items-center gap-2">
    <SectionIndicators
      uischema={binding.layout.uischema}
      path={binding.layout.path}
      errorMessage={objectErrors.message}
    />
    {#if group.collapsible}{#if group.collapsed}<ChevronRight size={16} />{:else}<ChevronDown
          size={16}
        />{/if}{/if}
  </span>
{/snippet}

{#if binding.layout.visible}
  <section
    class="card preset-outlined-surface-200-800 min-w-full"
    {...binding.skeletonProps('card')}
  >
    <Collapsible
      class="items-stretch"
      {getRootNode}
      open={!group.collapsed}
      onOpenChange={(details) => group.setExpanded(details.open)}
      ids={{ content: contentId }}
    >
      {#if binding.layout.label || group.collapsible || group.hasData || (objectErrors.message === undefined ? group.hasValidationErrors : Boolean(objectErrors.message))}
        <div class="px-4 py-2">
          {#if group.collapsible}
            <h3>
              <Collapsible.Trigger
                class="flex w-full items-center justify-between gap-2 text-left focus-visible:outline-2"
                aria-label={binding.layout.label || group.label}
              >
                {@render heading()}
              </Collapsible.Trigger>
            </h3>
          {:else}
            <h3 class="flex items-center justify-between gap-2">{@render heading()}</h3>
          {/if}
        </div>
      {/if}
      <Collapsible.Content id={contentId} hidden={group.collapsed}>
        {#if binding.layout.uischema.elements?.length}
          <div class="px-4 pb-4" data-object-static-fields>
            <LayoutRenderer
              schema={binding.layout.schema}
              uischema={{
                type: 'VerticalLayout',
                elements: binding.layout.uischema.elements,
                options: binding.layout.uischema.options,
              }}
              path={binding.layout.path}
              enabled={binding.layout.enabled}
              renderers={binding.layout.renderers}
              cells={binding.layout.cells}
            />
          </div>
        {/if}
        {#if props.children}
          <div class="pr-4 pb-4 pl-4">
            {@render props.children()}
          </div>
        {/if}
      </Collapsible.Content>
    </Collapsible>
  </section>
{/if}
