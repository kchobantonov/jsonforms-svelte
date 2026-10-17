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
  import { Card, Button } from 'flowbite-svelte';
  import { useFlowbiteLayout } from '../util';
  import { ChevronDownOutline, ChevronRightOutline } from 'flowbite-svelte-icons';
  import type { Snippet } from 'svelte';

  // Retain the existing public snippet prop for consumer compatibility.
  // eslint-disable-next-line svelte/no-unused-props
  const props: RendererProps<Layout> & { children?: Snippet } = $props();
  const binding = useFlowbiteLayout(useJsonFormsLayout(props));
  const group = useGroupState(() => binding.layout);
  const objectErrors = useObjectErrors(() => binding.layout);
  const contentId = $props.id();
</script>

{#snippet heading()}
  <span class="text-lg font-bold">{binding.layout.label}</span>
  <span class="flex items-center gap-2">
    <SectionIndicators
      uischema={binding.layout.uischema}
      path={binding.layout.path}
      errorMessage={objectErrors.message}
    />
    {#if group.collapsible}{#if group.collapsed}<ChevronRightOutline
          size="sm"
        />{:else}<ChevronDownOutline size="sm" />{/if}{/if}
  </span>
{/snippet}

{#if binding.layout.visible}
  <Card class="min-w-full" {...binding.flowbiteProps('Card')}>
    {#if binding.layout.label || group.collapsible || group.hasData || (objectErrors.message === undefined ? group.hasValidationErrors : Boolean(objectErrors.message))}
      <div>
        {#if group.collapsible}
          <h3>
            <Button
              class="w-full justify-between text-left"
              aria-label={binding.layout.label || group.label}
              color="alternative"
              aria-expanded={!group.collapsed}
              aria-controls={contentId}
              onclick={() => group.toggle()}
            >
              {@render heading()}
            </Button>
          </h3>
        {:else}
          <h3 class="flex items-center justify-between gap-2">{@render heading()}</h3>
        {/if}
      </div>
    {/if}
    <div id={contentId} hidden={group.collapsed}>
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
    </div>
  </Card>
{/if}
