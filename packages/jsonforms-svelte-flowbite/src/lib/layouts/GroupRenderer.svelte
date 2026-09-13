<script lang="ts">
  import {
    DispatchRenderer,
    useJsonFormsLayout,
    useGroupState,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte';
  import type { Layout } from '@jsonforms/core';
  import { Card, Heading, Button } from 'flowbite-svelte';
  import { useFlowbiteLayout } from '../util';
  import { ChevronDownOutline, ChevronRightOutline } from 'flowbite-svelte-icons';
  import type { Snippet } from 'svelte';

  const props: RendererProps<Layout> & { children?: Snippet } = $props();
  const binding = useFlowbiteLayout(useJsonFormsLayout(props));
  const group = useGroupState(
    () => binding.layout,
    () => binding.appliedOptions,
  );
  const contentId = $props.id();
</script>

{#if binding.layout.visible}
  <Card class="mt-1 mb-1 min-w-full" {...binding.flowbiteProps('Card')}>
    {#if binding.layout.label || group.collapsible || group.hasData}
      <div class="flex items-center justify-between gap-2">
        <Heading tag="h3" class="text-lg font-bold">{binding.layout.label}</Heading>
        <div class="flex items-center gap-2">
          {#if group.hasData}<span role="img" aria-label="Contains data" data-group-indicator
              >●</span
            >{/if}
          {#if group.collapsible}<Button
              color="alternative"
              size="xs"
              aria-label={binding.layout.label || 'Group'}
              aria-expanded={!group.collapsed}
              aria-controls={contentId}
              onclick={() => group.toggle()}
            >
              {#if group.collapsed}<ChevronRightOutline size="sm" />{:else}<ChevronDownOutline
                  size="sm"
                />{/if}
            </Button>{/if}
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
  </Card>
{/if}
