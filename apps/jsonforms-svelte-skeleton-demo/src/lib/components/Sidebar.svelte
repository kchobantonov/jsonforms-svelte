<script lang="ts">
  import {
    createDemoTranslator,
    filterPublicDemoExamples,
  } from '@chobantonov/jsonforms-svelte-demo-common';
  import { afterNavigate, goto } from '$app/navigation';
  import { page } from '$app/state';
  import { useAppStore } from '$lib/store/index.svelte';
  import { createSkeletonDemoExamples } from '@chobantonov/jsonforms-svelte-demo-common';
  import { SearchIcon } from '@lucide/svelte';
  import { Listbox, useListCollection } from '@skeletonlabs/skeleton-svelte';

  interface Props {
    headerHeight?: number;
  }

  let { headerHeight = 70 }: Props = $props();
  let searchQuery = $state('');
  let exampleSource = $state('spec');
  const sourceOptions = $derived(
    ['spec', 'jsonforms', 'all'].map((value) => ({
      value,
      label: translate(`sidebar.source.${value}`),
    })),
  );

  const appStore = useAppStore();
  const translate = $derived(createDemoTranslator(appStore.jsonforms.locale.value));
  const examples = createSkeletonDemoExamples(() => appStore.jsonforms.locale.value);
  let innerWidth = $state(0);
  const isDesktop = $derived(innerWidth >= 1280);
  const isDrawerOpen = $derived(appStore.drawer.value);
  const drawerClosedTransform = $derived(appStore.rtl ? 'translate-x-full' : '-translate-x-full');
  const closeSidebarOnMobileOnly = () => {
    const isLargeViewport =
      typeof window !== 'undefined' && window.matchMedia('(min-width: 1280px)').matches;
    if (!isLargeViewport) {
      appStore.drawer.value = false;
    }
  };

  const filteredExamples = $derived(filterPublicDemoExamples(examples, exampleSource, searchQuery));

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
    // Hash routes remain relative to both standalone and embedded demo pages.
    // eslint-disable-next-line svelte/no-navigation-without-resolve
    await goto(`#/examples/${encodeURIComponent(selected)}`);
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
    class="bg-surface-950/45 fixed inset-0 z-30 xl:hidden"
    aria-label={translate('sidebar.close')}
    onclick={closeSidebarOnMobileOnly}
  ></button>
{/if}

<aside
  class={`border-surface-200-800 bg-surface-50-950 start-0 z-40 w-64 border-e transition-transform ${
    !isDrawerOpen ? drawerClosedTransform : 'translate-x-0'
  } ${isDesktop ? 'fixed xl:block' : 'fixed'} `}
  style={`top: ${headerHeight}px; height: calc(100vh - ${headerHeight}px);`}
>
  <div class="scrolling-touch bg-surface-50-950 flex h-full max-w-2xs flex-col px-3 pt-4 pb-6">
    <div class="mb-4 shrink-0 ps-1 pt-1">
      <label class="mb-2 grid gap-1 text-sm">
        {translate('sidebar.source')}
        <select
          class="select w-full"
          bind:value={exampleSource}
          aria-label={translate('sidebar.source')}
        >
          {#each sourceOptions as option (option.value)}<option value={option.value}
              >{option.label}</option
            >{/each}
        </select>
      </label>
      <div class="relative">
        <SearchIcon
          class="text-surface-500-700 pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2"
        />
        <input
          type="text"
          placeholder={translate('sidebar.search')}
          aria-label={translate('sidebar.search')}
          bind:value={searchQuery}
          class="input w-full ps-9"
        />
      </div>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto pe-1">
      <div class="mb-3 pt-2">
        {#if listItems.length === 0}
          <p class="text-surface-500-700 px-2 text-sm">{translate('sidebar.empty')}</p>
        {:else}
          <Listbox
            class="w-full"
            {collection}
            value={selectedValue}
            onValueChange={(details) => handleSelection(details.value)}
          >
            <Listbox.Content aria-label={translate('sidebar.examples')} class="space-y-2">
              {#each listItems as item (item.value)}
                <Listbox.Item
                  {item}
                  class={`card rounded-container flex w-full cursor-pointer items-center p-3 text-sm font-medium transition ${
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
