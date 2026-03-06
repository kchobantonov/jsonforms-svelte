<script lang="ts">
  import { afterNavigate } from '$app/navigation';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { Listbox, useListCollection } from '@skeletonlabs/skeleton-svelte';
  import { SearchIcon } from '@lucide/svelte';
  import examples from '$lib/examples';
  import { useAppStore } from '$lib/store/index.svelte';

  interface Props {
    headerHeight?: number;
  }

  let { headerHeight = 70 }: Props = $props();
  let searchQuery = $state('');

  const appStore = useAppStore();
  let innerWidth = $state(0);
  const isDesktop = $derived(innerWidth >= 1280);
  const isDrawerOpen = $derived(appStore.drawer.value);
  const closeSidebarOnMobileOnly = () => {
    const isLargeViewport =
      typeof window !== 'undefined' && window.matchMedia('(min-width: 1280px)').matches;
    if (!isLargeViewport) {
      appStore.drawer.value = false;
    }
  };

  const filteredExamples = $derived.by(() => {
    if (!searchQuery.trim()) return examples;

    const query = searchQuery.toLowerCase();
    return examples.filter(
      ({ name, label }) =>
        name.toLowerCase().includes(query) || label.toLowerCase().includes(query),
    );
  });

  const listItems = $derived(
    filteredExamples.map(({ name, label }) => ({
      value: name,
      label,
    })),
  );

  const collection = $derived(
    useListCollection({
      items: listItems,
      itemToString: (item) => item.label,
      itemToValue: (item) => item.value,
    }),
  );

  const selectedValue = $derived(page.params.name ? [page.params.name] : []);

  async function handleSelection(value: string[]) {
    const selected = value[0];
    if (!selected) return;
    await goto(resolve('/examples/[name]', { name: selected }));
    closeSidebarOnMobileOnly();
  }

  afterNavigate(() => {
    document.getElementById('svelte')?.scrollTo({ top: 0 });
    const isLargeViewport =
      typeof window !== 'undefined' && window.matchMedia('(min-width: 1280px)').matches;
    if (!isLargeViewport) {
      appStore.drawer.value = false;
    }
  });
</script>

{#if !isDesktop && isDrawerOpen}
  <button
    type="button"
    class="fixed inset-0 z-30 bg-surface-950/45 xl:hidden"
    aria-label="Close examples menu"
    onclick={closeSidebarOnMobileOnly}
  ></button>
{/if}

<aside
  class={`start-0 z-40 w-64 border-e border-surface-200-800 bg-surface-50-950 transition-transform ${
    !isDrawerOpen ? '-translate-x-full' : 'translate-x-0'
  } ${isDesktop ? 'fixed xl:block' : 'fixed'} `}
  style={`top: ${headerHeight}px; height: calc(100vh - ${headerHeight}px);`}
>
  <div class="scrolling-touch flex h-full max-w-2xs flex-col bg-surface-50-950 px-3 pt-4 pb-6">
    <div class="mb-4 ps-1 pt-1 shrink-0">
      <div class="relative">
        <SearchIcon class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-surface-500-700" />
        <input
          type="text"
          placeholder="Search examples..."
          bind:value={searchQuery}
          class="input w-full ps-9"
        />
      </div>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto pe-1">
      <div class="mb-3 pt-2">
        {#if listItems.length === 0}
          <p class="px-2 text-sm text-surface-500-700">No examples found.</p>
        {:else}
          <Listbox
            class="w-full"
            {collection}
            value={selectedValue}
            onValueChange={(details) => handleSelection(details.value)}
          >
            <Listbox.Content class="space-y-2">
              {#each listItems as item (item.value)}
                <Listbox.Item
                  {item}
                  class={`card flex w-full cursor-pointer items-center rounded-container p-3 text-sm font-medium transition ${
                    page.params.name === item.value
                      ? 'preset-filled-primary-500'
                      : 'preset-outlined-surface-200-800 hover:preset-tonal'
                  }`}
                >
                  <Listbox.ItemText>{item.label}</Listbox.ItemText>
                </Listbox.Item>
              {/each}
            </Listbox.Content>
          </Listbox>
        {/if}
      </div>
    </div>
  </div>
</aside>

<svelte:window bind:innerWidth />
