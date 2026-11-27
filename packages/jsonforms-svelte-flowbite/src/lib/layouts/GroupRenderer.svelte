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
  import { Card, Button } from 'flowbite-svelte';
  import { useFlowbiteLayout } from '../util';
  import { ChevronDownOutline, ChevronRightOutline } from 'flowbite-svelte-icons';
  import type { Snippet } from 'svelte';

  // Retain the existing public snippet prop for consumer compatibility.
  const { children, ...props }: RendererProps<Layout> & { children?: Snippet } = $props();
  const binding = useFlowbiteLayout(useJsonFormsLayout(props));
  const group = useGroupState(() => binding.layout);
  const contentId = $props.id();
  const { showBorder, regions, footer } = $derived(group);
</script>

{#snippet heading()}
  <GroupHeading
    {group}
    {SectionIndicators}
    label={binding.layout.label}
    titleClass="text-lg font-bold"
    right={ChevronRightOutline}
    down={ChevronDownOutline}
    size="sm"
  />
{/snippet}

{#if binding.layout.visible}
  <Card
    data-group-frame
    role="group"
    aria-label={group.frameLabel}
    class={`min-w-full ${showBorder ? '' : 'border-0 shadow-none'}`}
    {...binding.flowbiteProps('Card')}
  >
    {#if regions.cover}
      <div data-group-cover class="[&_img]:block [&_img]:w-full [&_img]:object-cover">
        <LayoutChild layout={binding.layout} uischema={regions.cover} />
      </div>
    {/if}
    <GroupSectionHeader {group} layout={binding.layout} {heading} detailColor="#6b7280">
      {#snippet trigger()}
        <Button
          class={regions.header?.length
            ? 'justify-between text-left'
            : 'w-full justify-between text-left'}
          aria-label={group.triggerLabel}
          color="alternative"
          aria-expanded={!group.collapsed}
          aria-controls={contentId}
          onclick={() => group.toggle()}
        >
          {@render heading()}
        </Button>
      {/snippet}
    </GroupSectionHeader>
    <div id={contentId} hidden={group.collapsed}>
      <GroupBody {group} layout={binding.layout} {LayoutRenderer} {children} />
    </div>
    {#if footer?.length && !group.collapsible}
      <GroupFooterFields layout={binding.layout} elements={footer} framed />
    {/if}
  </Card>
{/if}
