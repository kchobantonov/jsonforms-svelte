<script lang="ts">
  import SectionIndicators from './SectionIndicators.svelte';
  import {
    useJsonFormsLayout,
    LayoutChild,
    GroupFooterFields,
    GroupSectionHeader,
    GroupBody,
    type RendererProps,
    useGroupState,
    GroupHeading,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import type { Layout } from '@jsonforms/core';
  import LayoutRenderer from './LayoutRenderer.svelte';
  import { useSkeletonLayout, getPortalRootNodeGetter } from '../util';
  import { ChevronDown, ChevronRight } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import { Collapsible } from '@skeletonlabs/skeleton-svelte';

  // Retain the existing public snippet prop for consumer compatibility.
  const { children, ...props }: RendererProps<Layout> & { children?: Snippet } = $props();
  const binding = useSkeletonLayout(useJsonFormsLayout(props));
  const group = useGroupState(() => binding.layout);
  const contentId = $props.id();
  const getRootNode = getPortalRootNodeGetter();
  const { showBorder, regions, footer } = $derived(group);
</script>

{#snippet heading()}
  <GroupHeading
    {group}
    {SectionIndicators}
    label={binding.layout.label}
    titleClass="text-lg font-bold"
    right={ChevronRight}
    down={ChevronDown}
    size={16}
  />
{/snippet}

{#if binding.layout.visible}
  <section
    data-group-frame
    role="group"
    aria-label={group.frameLabel}
    class={`card min-w-full ${showBorder ? 'preset-outlined-surface-200-800' : 'border-0 shadow-none'}`}
    {...binding.skeletonProps('card')}
  >
    {#if regions.cover}
      <header data-group-cover class="[&_img]:block [&_img]:w-full [&_img]:object-cover">
        <LayoutChild layout={binding.layout} uischema={regions.cover} />
      </header>
    {/if}
    <Collapsible
      class="items-stretch"
      {getRootNode}
      open={!group.collapsed}
      onOpenChange={(details) => group.setExpanded(details.open)}
      ids={{ content: contentId }}
    >
      <GroupSectionHeader {group} layout={binding.layout} {heading} detailOpacity="0.6">
        {#snippet trigger()}
          <Collapsible.Trigger
            class={regions.header?.length
              ? 'flex items-center justify-between gap-2 text-left focus-visible:outline-2'
              : 'flex w-full items-center justify-between gap-2 text-left focus-visible:outline-2'}
            aria-label={group.triggerLabel}
          >
            {@render heading()}
          </Collapsible.Trigger>
        {/snippet}
      </GroupSectionHeader>
      <Collapsible.Content id={contentId} hidden={group.collapsed}>
        <GroupBody {group} layout={binding.layout} {LayoutRenderer} {children} />
      </Collapsible.Content>
    </Collapsible>
    {#if footer?.length && !group.collapsible}
      <GroupFooterFields layout={binding.layout} elements={footer} framed />
    {/if}
  </section>
{/if}
