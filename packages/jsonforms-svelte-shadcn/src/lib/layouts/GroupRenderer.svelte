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
  import * as Collapsible from '@jsonforms-svelte-shadcn-ui/collapsible';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import * as Card from '@jsonforms-svelte-shadcn-ui/card';
  import { useShadcnLayout } from '../util';
  import type { Snippet } from 'svelte';

  // eslint-disable-next-line svelte/no-unused-props
  const props: RendererProps<Layout> & { children?: Snippet } = $props();
  const binding = useShadcnLayout(useJsonFormsLayout(props));
  const group = useGroupState(() => binding.layout);
  const objectErrors = useObjectErrors(() => binding.layout);
  const contentId = $props.id();
</script>

{#snippet heading()}
  <span class="font-semibold">{binding.layout.label}</span>
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
  <Card.Root class="min-w-full" {...binding.shadcnProps('card')}>
    <Collapsible.Root
      class="flex flex-col gap-(--card-spacing)"
      open={!group.collapsed}
      onOpenChange={group.setExpanded}
    >
      {#if binding.layout.label || group.collapsible || group.hasData || (objectErrors.message === undefined ? group.hasValidationErrors : Boolean(objectErrors.message))}
        <Card.Header>
          {#if group.collapsible}
            <h3>
              <Collapsible.Trigger
                class="focus-visible:outline-ring flex w-full items-center justify-between gap-2 rounded-md text-left focus-visible:outline-2"
                aria-label={binding.layout.label || group.label}
              >
                {@render heading()}
              </Collapsible.Trigger>
            </h3>
          {:else}
            <h3 class="flex items-center justify-between gap-2">{@render heading()}</h3>
          {/if}
        </Card.Header>
      {/if}
      <Collapsible.Content
        id={contentId}
        forceMount
        hiddenUntilFound={false}
        hidden={group.collapsed}
      >
        {#if binding.layout.uischema.elements?.length}
          <Card.Content data-object-static-fields>
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
          </Card.Content>
        {/if}
        {#if props.children}
          <Card.Content class="mt-(--card-spacing)">
            {@render props.children()}
          </Card.Content>
        {/if}
      </Collapsible.Content>
    </Collapsible.Root>
  </Card.Root>
{/if}
