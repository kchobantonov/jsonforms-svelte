<script lang="ts">
  import SectionIndicators from './SectionIndicators.svelte';
  import {
    useJsonFormsLayout,
    useGroupState,
    useObjectErrors,
    useJsonForms,
    useDynamicTreeResolver,
    InitialFocusView,
    DispatchRenderer,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte';
  import type { Layout, UISchemaElement } from '@jsonforms/core';
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
  const form = useJsonForms();
  const objectErrors = useObjectErrors(() => binding.layout);
  const contentId = $props.id();
  const showBorder = $derived(binding.layout.uischema.options?.showBorder !== false);
  const regions = $derived(
    binding.layout.uischema as Layout & {
      cover?: UISchemaElement;
      header?: UISchemaElement[];
      i18n?: string;
      footer?: UISchemaElement[];
    },
  );
  const footer = $derived(regions.footer);
  const resolveHeader = useDynamicTreeResolver();
  const headerLabel = $derived(
    regions.header
      ?.map((element) => resolveHeader(element, binding.layout.path, binding.layout.pathSegments))
      .find((element) => element.type === 'Label') as { text?: string; i18n?: string } | undefined,
  );
  const headerTitle = $derived(
    headerLabel?.i18n
      ? (form.i18n?.translate?.(`${headerLabel.i18n}.text`, headerLabel.text) ?? headerLabel.text)
      : headerLabel?.text,
  );
</script>

{#snippet heading()}
  {#if !regions.header?.length}<span class="font-semibold">{binding.layout.label}</span>{/if}
  <span class="flex items-center gap-2">
    <SectionIndicators
      uischema={binding.layout.uischema}
      path={binding.layout.path}
      pathSegments={binding.layout.pathSegments}
      errorMessage={objectErrors.message}
      errorErrors={objectErrors.errors}
    />
    {#if group.collapsible}{#if group.collapsed}<ChevronRight size={16} />{:else}<ChevronDown
          size={16}
        />{/if}{/if}
  </span>
{/snippet}

{#if binding.layout.visible}
  <Card.Root
    data-group-frame
    role="group"
    aria-label={headerTitle || binding.layout.label || undefined}
    class={`min-w-full ${regions.cover ? 'pt-0' : ''} ${showBorder ? '' : 'border-0 shadow-none'}`}
    {...binding.shadcnProps('card')}
  >
    {#if regions.cover}
      <div data-group-cover class="[&_img]:block [&_img]:w-full [&_img]:object-cover">
        <DispatchRenderer
          schema={binding.layout.schema}
          uischema={regions.cover}
          path={binding.layout.path}
          enabled={binding.layout.enabled}
          renderers={binding.layout.renderers}
          cells={binding.layout.cells}
        />
      </div>
    {/if}
    <Collapsible.Root
      class="flex flex-col gap-(--card-spacing)"
      open={!group.collapsed}
      onOpenChange={group.setExpanded}
    >
      {#if binding.layout.label || group.collapsible || group.hasData || regions.header?.length || (objectErrors.message === undefined ? group.hasValidationErrors : Boolean(objectErrors.message))}
        <Card.Header
          class={regions.header?.length
            ? 'flex flex-row items-start justify-between gap-3'
            : undefined}
        >
          {#if regions.header?.length}
            <div data-group-header class="grid min-w-0 gap-1">
              {#each regions.header as element, index (index)}
                <div class={index === 0 ? 'group-header-title' : 'group-header-detail'}>
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
            </div>
          {/if}
          {#if group.collapsible}
            <h3 class={regions.header?.length ? 'ml-auto shrink-0' : undefined}>
              <Collapsible.Trigger
                class="focus-visible:outline-ring flex w-full items-center justify-between gap-2 rounded-md text-left focus-visible:outline-2"
                aria-label={headerTitle || binding.layout.label || group.label}
              >
                {@render heading()}
              </Collapsible.Trigger>
            </h3>
          {:else if !regions.header?.length}
            <h3 class="flex items-center justify-between gap-2">{@render heading()}</h3>
          {:else}
            <span class="ml-auto flex items-center gap-2"
              ><SectionIndicators
                uischema={binding.layout.uischema}
                path={binding.layout.path}
                pathSegments={binding.layout.pathSegments}
                errorMessage={objectErrors.message}
                errorErrors={objectErrors.errors}
              /></span
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
        <InitialFocusView active={!group.collapsed}>
          {#if binding.layout.uischema.elements?.length}
            <Card.Content
              data-object-static-fields
              class={footer?.length ? 'pb-(--card-spacing)' : undefined}
            >
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
        </InitialFocusView>
        {#if group.collapsible && footer?.length}
          <Card.Footer data-group-footer class="border-border flex-wrap gap-2">
            {#each footer as element, index (index)}
              <span class={element.options?.fullWidth ? 'w-full' : 'inline-flex w-auto flex-none'}
                ><DispatchRenderer
                  schema={binding.layout.schema}
                  uischema={element}
                  path={binding.layout.path}
                  enabled={binding.layout.enabled}
                  renderers={binding.layout.renderers}
                  cells={binding.layout.cells}
                /></span
              >
            {/each}
          </Card.Footer>
        {/if}
      </Collapsible.Content>
    </Collapsible.Root>
    {#if footer?.length && !group.collapsible}
      <Card.Footer data-group-footer class="border-border flex-wrap gap-2">
        {#each footer as element, index (index)}
          <span class={element.options?.fullWidth ? 'w-full' : 'inline-flex w-auto flex-none'}>
            <DispatchRenderer
              schema={binding.layout.schema}
              uischema={element}
              path={binding.layout.path}
              enabled={binding.layout.enabled}
              renderers={binding.layout.renderers}
              cells={binding.layout.cells}
            />
          </span>
        {/each}
      </Card.Footer>
    {/if}
  </Card.Root>
{/if}

<style>
  .group-header-title :global(p) {
    font-size: 1rem;
    font-weight: 600;
  }
  .group-header-detail :global(p) {
    font-size: 0.875rem;
    font-weight: 400;
    color: var(--muted-foreground);
  }
</style>
