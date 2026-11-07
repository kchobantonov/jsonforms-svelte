<script lang="ts">
  import { tick, untrack } from 'svelte';
  import SectionIndicators from './SectionIndicators.svelte';
  import {
    DispatchRenderer,
    InitialFocusView,
    useJsonFormsCategorization,
    useCategorySelection,
    categoryFocusWasLost,
    useJsonForms,
    resolveCollapsed,
    useCollapsedOptionDiagnostic,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte';
  import type { Layout } from '@jsonforms/core';
  import { useSkeletonLayout } from '../util';
  import { ChevronDown } from '@lucide/svelte';
  import { Accordion } from '@skeletonlabs/skeleton-svelte';
  const props: RendererProps<Layout> = $props();
  const binding = useSkeletonLayout(useJsonFormsCategorization(props));
  const form = useJsonForms();
  useCollapsedOptionDiagnostic(
    () => binding.layout.uischema.options,
    () => form.config,
    'accordion',
  );
  const selection = useCategorySelection(
    {
      get categories() {
        return binding.categories;
      },
      get initial() {
        return binding.layout.uischema.options?.initial;
      },
      get collapsed() {
        return resolveCollapsed(binding.layout.uischema.options, form.config, 'accordion');
      },
    },
    true,
  );
  let root = $state<HTMLDivElement>();
  let focusedElement: HTMLElement | undefined;
  let nativeEntries = $state.raw(selection.allEntries);
  let nativeKey = $state(selection.key);
  // Skeleton's accordion item context can still be processing a focused
  // trigger during the same update that removes it. Let that update finish
  // before replacing the native item list and selected value.
  $effect(() => {
    const nextEntries = selection.allEntries;
    const nextKey = selection.key;
    const focusedKey = focusedElement?.matches(':focus')
      ? focusedElement.closest<HTMLElement>('[data-category-key]')?.dataset.categoryKey
      : undefined;
    const removingFocused =
      nextEntries.length > 0 &&
      !!focusedKey &&
      untrack(() => nativeEntries.some((entry) => entry.key === focusedKey)) &&
      !nextEntries.some((entry) => entry.key === focusedKey);
    if (!removingFocused) {
      nativeEntries = nextEntries;
      nativeKey = nextKey;
      return;
    }
    const frame = requestAnimationFrame(() => {
      nativeEntries = nextEntries;
      nativeKey = nextKey;
    });
    return () => cancelAnimationFrame(frame);
  });
  let previousKey = untrack(() => nativeKey);
  // Keep a removed native item for one update so its focused trigger can hand
  // focus to the fallback before Skeleton tears down the item context.
  let retainedEntries = $state.raw(untrack(() => nativeEntries));
  let retentionRevision = 0;
  const renderEntries = $derived.by(() => {
    const current = nativeEntries;
    const keys = new Set(current.map((entry) => entry.key));
    return [...current, ...retainedEntries.filter((entry) => !keys.has(entry.key))];
  });
  $effect(() => {
    const current = nativeEntries;
    const keys = new Set(current.map((entry) => entry.key));
    const revision = ++retentionRevision;
    if (retainedEntries.some((entry) => !keys.has(entry.key))) {
      void tick().then(() => {
        if (revision !== retentionRevision) return;
        if (current.length === 0) focusedElement?.blur();
        const focusedItem = focusedElement?.closest<HTMLElement>('[data-category-key]');
        if (focusedItem && !keys.has(focusedItem.dataset.categoryKey ?? '')) {
          const fallback = [
            ...(root?.querySelectorAll<HTMLElement>('[data-category-key]') ?? []),
          ].find((item) => item.dataset.categoryKey === nativeKey);
          fallback?.querySelector<HTMLElement>('[data-part="item-trigger"]')?.focus();
        }
        retainedEntries = current;
      });
    } else {
      retainedEntries = current;
    }
  });
  $effect(() => {
    const key = nativeKey;
    if (key === previousKey) return;
    previousKey = key;
    void tick().then(() => {
      if (categoryFocusWasLost(root, focusedElement)) {
        const triggers = root?.querySelectorAll<HTMLElement>(
          '[data-scope="accordion"][data-part="item-trigger"]:not([disabled])',
        );
        triggers?.item(selection.index)?.focus();
      }
    });
  });
</script>

{#if binding.layout.visible && renderEntries.length}
  <div
    bind:this={root}
    hidden={!selection.entries.length}
    onfocusin={(event) => {
      if (event.target instanceof HTMLElement) focusedElement = event.target;
    }}
  >
    <Accordion
      {...binding.skeletonProps('Accordion')}
      multiple={false}
      collapsible
      value={nativeEntries.length
        ? nativeKey
          ? [nativeKey]
          : []
        : retainedEntries[0]
          ? [retainedEntries[0].key]
          : []}
      onValueChange={(event) => selection.selectKey(event.value[0])}
    >
      {#each renderEntries as entry (entry.key)}
        {@const retired =
          selection.allEntries.length > 0 &&
          !selection.allEntries.some((current) => current.key === entry.key)}
        <Accordion.Item
          value={entry.key}
          data-category-key={entry.key}
          hidden={retired || !entry.category.visible}
        >
          <Accordion.ItemTrigger
            disabled={retired || !entry.category.visible}
            class="flex w-full items-center justify-between p-4"
          >
            <span class="flex min-w-0 flex-1 items-center gap-2">
              <span>{entry.category.label}</span>
              <SectionIndicators
                class="ms-auto"
                uischema={entry.category.uischema}
                path={binding.layout.path}
                pathSegments={binding.layout.pathSegments}
              />
            </span>
            <Accordion.ItemIndicator>
              <ChevronDown size={16} aria-hidden="true" />
            </Accordion.ItemIndicator>
          </Accordion.ItemTrigger>
          <Accordion.ItemContent class="p-4">
            {#if !retired && entry.category.visible}
              <InitialFocusView active={selection.key === entry.key}>
                <DispatchRenderer
                  schema={binding.layout.schema}
                  uischema={entry.category.uischema}
                  path={binding.layout.path}
                  enabled={binding.layout.enabled}
                  renderers={binding.layout.renderers}
                  cells={binding.layout.cells}
                />
              </InitialFocusView>
            {/if}
          </Accordion.ItemContent>
        </Accordion.Item>
      {/each}
    </Accordion>
  </div>
{/if}
