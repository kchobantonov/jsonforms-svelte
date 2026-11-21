<script lang="ts">
  import SectionIndicators from './SectionIndicators.svelte';
  import {
    useJsonFormsLayout,
    useGroupState,
    useObjectErrors,
    useJsonForms,
    InitialFocusView,
    DispatchRenderer,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte';
  import type { Layout, UISchemaElement } from '@jsonforms/core';
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
  const headerLabel = $derived(regions.header?.find((element) => element.type === 'Label') as { text?: string; i18n?: string } | undefined);
  const headerTitle = $derived(headerLabel?.i18n
    ? form.i18n?.translate?.(`${headerLabel.i18n}.text`, headerLabel.text) ?? headerLabel.text
    : headerLabel?.text);
</script>

{#snippet heading()}
  {#if !regions.header?.length}<span class="text-lg font-bold">{binding.layout.label}</span>{/if}
  <span class="flex items-center gap-2">
    <SectionIndicators
      uischema={binding.layout.uischema}
      path={binding.layout.path}
      pathSegments={binding.layout.pathSegments}
      errorMessage={objectErrors.message}
      errorErrors={objectErrors.errors}
    />
    {#if group.collapsible}{#if group.collapsed}<ChevronRightOutline
          size="sm"
        />{:else}<ChevronDownOutline size="sm" />{/if}{/if}
  </span>
{/snippet}

{#if binding.layout.visible}
  <Card
    data-group-frame
    role="group"
    aria-label={headerTitle || binding.layout.label || undefined}
    class={`min-w-full ${showBorder ? '' : 'border-0 shadow-none'}`}
    {...binding.flowbiteProps('Card')}
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
    {#if binding.layout.label || group.collapsible || group.hasData || regions.header?.length || (objectErrors.message === undefined ? group.hasValidationErrors : Boolean(objectErrors.message))}
      <header
        class={regions.header?.length
          ? 'flex flex-row-reverse items-start justify-between gap-3 px-4 py-2'
          : 'px-4 py-2'}
      >
        {#if group.collapsible}
          <h3 class={regions.header?.length ? 'ml-auto shrink-0' : undefined}>
            <Button
              class={regions.header?.length ? 'justify-between text-left' : 'w-full justify-between text-left'}
              aria-label={headerTitle || binding.layout.label || group.label}
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
        {#if regions.header?.length}
          <div data-group-header class="grid min-w-0 gap-1">
            {#each regions.header as element, index (index)}
              <div class={index === 0 ? 'group-header-title' : 'group-header-detail'}><DispatchRenderer
                schema={binding.layout.schema}
                uischema={element}
                path={binding.layout.path}
                enabled={binding.layout.enabled}
                renderers={binding.layout.renderers}
                cells={binding.layout.cells}
              /></div>
            {/each}
          </div>
        {/if}
      </header>
    {/if}
    <div id={contentId} hidden={group.collapsed}>
      <InitialFocusView active={!group.collapsed}>
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
      </InitialFocusView>
      {#if group.collapsible && footer?.length}
        <footer data-group-footer class="flex flex-wrap items-center gap-2 px-4 pt-4 pb-4">
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
        </footer>
      {/if}
    </div>
    {#if footer?.length && !group.collapsible}
      <footer data-group-footer class="flex flex-wrap items-center gap-2 px-4 pt-4 pb-4">
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
      </footer>
    {/if}
  </Card>
{/if}

<style>
  .group-header-title :global(p) { font-size: 1.125rem; font-weight: 700; }
  .group-header-detail :global(p) { font-size: 0.875rem; font-weight: 400; color: #6b7280; }
</style>
