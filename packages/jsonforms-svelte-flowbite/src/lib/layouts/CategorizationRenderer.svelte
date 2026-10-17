<script lang="ts">
  import SectionIndicators from './SectionIndicators.svelte';
  import {
    type RendererProps,
    DispatchRenderer,
    useJsonFormsCategorization,
    useCategorySelection,
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
  const selection = useCategorySelection({
    get categories() {
      return binding.categories;
    },
    get initial() {
      return binding.layout.uischema.options?.initial;
    },
  });
  const vertical = $derived(binding.layout.uischema.options?.vertical === true);
  const native = $derived(binding.flowbiteProps('Tabs') as Partial<TabsProps>);
  const tabButtons = () =>
    Array.from(
      root?.querySelectorAll<HTMLButtonElement>(':scope > [role="tablist"] > li > [role="tab"]') ??
        [],
    );
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
      bind:selected={
        () => tabId(selection.key), (value) => selection.selectKey(value?.slice(id.length + 1))
      }
    >
      {#each selection.entries as entry (entry.key)}
        <TabItem {...binding.flowbiteProps('TabItem')} key={tabId(entry.key)}>
          {#snippet titleSlot()}<span class="inline-flex items-center gap-1"
              >{entry.category.label}<SectionIndicators
                uischema={entry.category.uischema}
                path={binding.layout.path}
              /></span
            >{/snippet}
          <DispatchRenderer
            schema={binding.layout.schema}
            uischema={entry.category.uischema}
            path={binding.layout.path}
            enabled={binding.layout.enabled}
            renderers={binding.layout.renderers}
            cells={binding.layout.cells}
          />
        </TabItem>
      {/each}
    </Tabs>
  </div>
{/if}
