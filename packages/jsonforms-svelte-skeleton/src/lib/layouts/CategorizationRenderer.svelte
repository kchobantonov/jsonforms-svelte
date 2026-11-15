<script lang="ts">
  import { tick, untrack } from 'svelte';
  import SectionIndicators from './SectionIndicators.svelte';
  import {
    type RendererProps,
    DispatchRenderer,
    InitialFocusView,
    useJsonFormsCategorization,
    useCategorySelection,
    categoryFocusWasLost,
  } from '@chobantonov/jsonforms-svelte';
  import type { Layout } from '@jsonforms/core';
  import { Tabs } from '@skeletonlabs/skeleton-svelte';
  import { useSkeletonLayout } from '../util';
  import { observeInheritedDirection, type TextDirection } from '../util/inheritedDirection';

  let props: RendererProps<Layout> = $props();

  const binding = useSkeletonLayout(useJsonFormsCategorization(props));
  let inheritedDirection = $state<TextDirection>('ltr');
  const selection = useCategorySelection({
    get categories() {
      return binding.categories;
    },
    get initial() {
      return binding.layout.uischema.options?.initial;
    },
  });
  let nativeEntries = $state.raw(selection.allEntries);
  let nativeKey = $state(selection.key);
  $effect(() => {
    const nextEntries = selection.allEntries;
    const nextKey = selection.key;
    const focusedKey = focusedElement?.matches(':focus')
      ? focusedElement.dataset.categoryKey
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
  let root = $state<HTMLDivElement>();
  let focusedElement: HTMLElement | undefined;
  let previousKey = untrack(() => nativeKey);
  // Keep a removed trigger for one update while focus moves to the fallback.
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
        if (focusedElement && !keys.has(focusedElement.dataset.categoryKey ?? '')) {
          const fallback = [...(root?.querySelectorAll<HTMLElement>('[role="tab"]') ?? [])].find(
            (tab) => tab.dataset.categoryKey === nativeKey,
          );
          fallback?.focus();
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
      if (categoryFocusWasLost(root, focusedElement))
        root?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')?.focus();
    });
  });
</script>

{#if binding.layout.visible && renderEntries.length}
  <div
    bind:this={root}
    hidden={!nativeEntries.some((entry) => entry.category.visible)}
    use:observeInheritedDirection={(direction) => (inheritedDirection = direction)}
    onfocusin={(event) => {
      if (event.target instanceof HTMLElement) focusedElement = event.target;
    }}
    class={`category-tabs ${binding.styles.categorization.root ?? ''}`}
  >
    <Tabs
      orientation={binding.layout.uischema.options?.vertical === true ? 'vertical' : 'horizontal'}
      value={nativeKey || retainedEntries[0]?.key || ''}
      onValueChange={(e) => {
        if (!e.value || !selection.entries.some((entry) => entry.key === e.value)) return;
        nativeKey = e.value;
        selection.selectKey(e.value);
      }}
      {...binding.skeletonProps('Tabs')}
      dir={inheritedDirection}
    >
      <div class="category-tabs-scroll">
        <Tabs.List
          class={binding.layout.uischema.options?.vertical === true
            ? 'h-auto w-max flex-col'
            : 'w-max'}
        >
          {#each renderEntries as entry (entry.key)}
            {@const retired =
              nativeEntries.length > 0 &&
              !nativeEntries.some((current) => current.key === entry.key)}
            <Tabs.Trigger
              value={entry.key}
              data-category-key={entry.key}
              hidden={retired || !entry.category.visible}
              disabled={retired || !entry.category.visible}
            >
              {#if selection.allEntries.some((current) => current.key === entry.key && current.category.visible)}
                {entry.category.label}<SectionIndicators
                  uischema={entry.category.uischema}
                  path={binding.layout.path}
                  pathSegments={binding.layout.pathSegments}
                />
              {/if}
            </Tabs.Trigger>
          {/each}
          <Tabs.Indicator />
        </Tabs.List>
      </div>

      {#each nativeEntries.length ? nativeEntries.filter((entry) => entry.category.visible) : retainedEntries.filter((entry) => entry.category.visible) as entry (entry.key)}
        <Tabs.Content value={entry.key}>
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
        </Tabs.Content>
      {/each}
    </Tabs>
  </div>
{/if}

<style>
  .category-tabs {
    min-width: 0;
    max-width: 100%;
  }
  .category-tabs-scroll {
    min-width: 0;
    max-width: 100%;
    overflow-x: auto;
  }
</style>
