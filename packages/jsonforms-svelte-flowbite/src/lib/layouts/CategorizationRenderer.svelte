<script lang="ts">
  import { tick } from 'svelte';
  import SectionIndicators from './SectionIndicators.svelte';
  import {
    type RendererProps,
    DispatchRenderer,
    InitialFocusView,
    useJsonFormsCategorization,
    useCategorySelection,
    categoryFocusWasLost,
    usePendingControlChanges,
  } from '@chobantonov/jsonforms-svelte';
  import type { Layout } from '@jsonforms/core';
  import { Tabs, TabItem, type TabsProps } from 'flowbite-svelte';
  import { twMerge } from 'tailwind-merge';
  import clsx from 'clsx';
  import { useFlowbiteLayout } from '../util';

  let props: RendererProps<Layout> = $props();

  const id = $props.id();
  let root = $state<HTMLDivElement>();
  const tabId = (key: string | undefined) => (key === undefined ? undefined : `${id}-${key}`);
  const binding = useFlowbiteLayout(useJsonFormsCategorization(props));
  const pending = usePendingControlChanges();
  const selection = useCategorySelection({
    get categories() {
      return binding.categories;
    },
    get initial() {
      return binding.layout.uischema.options?.initial;
    },
  });
  let focusedElement: HTMLElement | undefined;
  let previousKey = selection.key;
  $effect(() => {
    const key = selection.key;
    if (key === previousKey) return;
    previousKey = key;
    void tick().then(() => {
      if (categoryFocusWasLost(root, focusedElement))
        root?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')?.focus();
    });
  });
  const vertical = $derived(binding.layout.uischema.options?.vertical === true);
  const native = $derived(binding.flowbiteProps('Tabs') as Partial<TabsProps>);
  const tabButtons = () =>
    Array.from(
      root?.querySelectorAll<HTMLButtonElement>(':scope > [role="tablist"] > li > [role="tab"]') ??
        [],
    );
  function selectTab(value: string | undefined) {
    if (pending.isBlocked()) return;
    pending.flush();
    if (!pending.isBlocked()) selection.selectKey(value?.slice(id.length + 1));
  }
  // Native TabItem owns the button; Tabs exposes events on its tablist but no roving-focus API.
  $effect(() => {
    const selected = tabId(selection.key);
    const ids = new Set(selection.entries.map((entry) => tabId(entry.key)));
    for (const button of tabButtons())
      button.tabIndex = ids.has(button.id) && button.id === selected ? 0 : -1;
  });
  function navigate(event: KeyboardEvent) {
    if (!(event.target instanceof HTMLButtonElement) || event.target.role !== 'tab') return;
    const buttons = tabButtons().filter((button) => !button.disabled);
    const index = buttons.indexOf(event.target);
    if (index < 0) return;
    const rtl = getComputedStyle(event.target).direction === 'rtl';
    const forward = vertical ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight';
    const backward = vertical ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft';
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? buttons.length - 1
          : event.key === forward
            ? (index + 1) % buttons.length
            : event.key === backward
              ? (index - 1 + buttons.length) % buttons.length
              : undefined;
    if (next === undefined) return;
    event.preventDefault();
    buttons[next].focus();
    buttons[next].click();
  }
</script>

{#if binding.layout.visible && selection.entries.length}
  <div
    bind:this={root}
    onfocusin={(event) => {
      if (event.target instanceof HTMLElement) focusedElement = event.target;
    }}
    class={`min-w-0 ${vertical ? 'flex items-start gap-4' : ''} ${binding.styles.categorization.root ?? ''}`}
  >
    <Tabs
      {...native}
      class={twMerge(
        vertical ? 'shrink-0 flex-col gap-2 space-x-0' : 'max-w-full overflow-x-auto',
        clsx(native.class),
      )}
      classes={{
        ...native.classes,
        content: twMerge(vertical ? 'mt-0 min-w-0 flex-1' : '', clsx(native.classes?.content)),
      }}
      divider={vertical ? false : native.divider}
      aria-orientation={vertical ? 'vertical' : 'horizontal'}
      onkeydown={navigate}
      bind:selected={() => tabId(selection.key), selectTab}
    >
      {#each selection.entries as entry (entry.key)}
        <TabItem {...binding.flowbiteProps('TabItem')} key={tabId(entry.key)}>
          {#snippet titleSlot()}<span class="inline-flex items-center gap-1"
              >{entry.category.label}<SectionIndicators
                uischema={entry.category.uischema}
                path={binding.layout.path}
              /></span
            >{/snippet}
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
        </TabItem>
      {/each}
    </Tabs>
    <!-- Native Tabs renders only its selected snippet; keep other categories mounted
         so renderer-owned validation remains part of the form-wide result. -->
    {#each selection.entries as entry (entry.key)}
      {#if entry.key !== selection.key}
        <div hidden inert aria-hidden="true">
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
        </div>
      {/if}
    {/each}
  </div>
{/if}
