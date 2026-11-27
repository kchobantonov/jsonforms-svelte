<script lang="ts">
  import SectionIndicators from './SectionIndicators.svelte';
  import {
    useJsonFormsLayout,
    LayoutChild,
    GroupFooterFields,
    GroupHeaderFields,
    GroupBody,
    type RendererProps,
    useGroupState,
    GroupHeading,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import type { Layout } from '@jsonforms/core';
  import LayoutRenderer from './LayoutRenderer.svelte';
  import * as Collapsible from '@jsonforms-svelte-shadcn-ui/collapsible';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import * as Card from '@jsonforms-svelte-shadcn-ui/card';
  import { useShadcnLayout } from '../util';
  import type { Snippet } from 'svelte';

  const { children, ...props }: RendererProps<Layout> & { children?: Snippet } = $props();
  const binding = useShadcnLayout(useJsonFormsLayout(props));
  const group = useGroupState(() => binding.layout);
  const contentId = $props.id();
  const { showBorder, regions, footer } = $derived(group);
</script>

{#snippet groupFooter()}
  <Card.Footer data-group-footer class="border-border flex-wrap gap-2">
    <GroupFooterFields layout={binding.layout} elements={footer ?? []} />
  </Card.Footer>
{/snippet}

{#snippet heading()}
  <GroupHeading
    {group}
    {SectionIndicators}
    label={binding.layout.label}
    titleClass="font-semibold"
    right={ChevronRight}
    down={ChevronDown}
    size={16}
  />
{/snippet}

{#if binding.layout.visible}
  <Card.Root
    data-group-frame
    role="group"
    aria-label={group.frameLabel}
    class={`min-w-full ${regions.cover ? 'pt-0' : ''} ${showBorder ? '' : 'border-0 shadow-none'}`}
    {...binding.shadcnProps('card')}
  >
    {#if regions.cover}
      <div data-group-cover class="[&_img]:block [&_img]:w-full [&_img]:object-cover">
        <LayoutChild layout={binding.layout} uischema={regions.cover} />
      </div>
    {/if}
    <Collapsible.Root
      class="flex flex-col gap-(--card-spacing)"
      open={!group.collapsed}
      onOpenChange={group.setExpanded}
    >
      {#if group.showHeading}
        <Card.Header
          class={regions.header?.length
            ? 'flex flex-row items-start justify-between gap-3'
            : undefined}
        >
          {#if regions.header?.length}
            <GroupHeaderFields
              layout={binding.layout}
              elements={regions.header}
              --group-title-size="1rem"
              --group-title-weight="600"
              --group-detail-color="var(--muted-foreground)"
            />
          {/if}
          {#if group.collapsible}
            <h3 class={regions.header?.length ? 'ml-auto shrink-0' : undefined}>
              <Collapsible.Trigger
                class="focus-visible:outline-ring flex w-full items-center justify-between gap-2 rounded-md text-left focus-visible:outline-2"
                aria-label={group.triggerLabel}
              >
                {@render heading()}
              </Collapsible.Trigger>
            </h3>
          {:else if !regions.header?.length}
            <h3 class="flex items-center justify-between gap-2">{@render heading()}</h3>
          {:else}
            <span class="ml-auto flex items-center gap-2"
              ><SectionIndicators {...group.indicatorProps} /></span
            >
          {/if}
        </Card.Header>
      {/if}
      <Collapsible.Content
        id={contentId}
        forceMount
        hiddenUntilFound={false}
        hidden={group.collapsed}
      >
        <GroupBody
          {group}
          layout={binding.layout}
          {LayoutRenderer}
          {children}
          footer={groupFooter}
          Content={Card.Content}
        />
      </Collapsible.Content>
    </Collapsible.Root>
    {#if footer?.length && !group.collapsible}
      {@render groupFooter()}
    {/if}
  </Card.Root>
{/if}
