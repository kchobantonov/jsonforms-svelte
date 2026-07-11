<script lang="ts">
  import { afterNavigate } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { useAppStore } from '$lib/store/index.svelte';
  import { createShadcnDemoExamples } from '@chobantonov/jsonforms-svelte-demo-common';
  import { SearchIcon } from '@lucide/svelte';
  import { Button, Input, ScrollArea } from '@chobantonov/jsonforms-svelte-shadcn';

  interface Props {
    headerHeight?: number;
  }

  let { headerHeight = 70 }: Props = $props();
  let searchQuery = $state('');

  const appStore = useAppStore();
  const examples = createShadcnDemoExamples(() => appStore.jsonforms.locale.value);
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
  <Button
    variant="ghost"
    class="fixed inset-0 z-30 h-auto w-auto rounded-none bg-black/45 xl:hidden"
    aria-label="Close examples menu"
    onclick={closeSidebarOnMobileOnly}
  />
{/if}

<aside
  class={`start-0 z-40 w-64 border-e border-border bg-background transition-transform ${
    !isDrawerOpen ? drawerClosedTransform : 'translate-x-0'
  } ${isDesktop ? 'fixed xl:block' : 'fixed'} `}
  style={`top: ${headerHeight}px; height: calc(100vh - ${headerHeight}px);`}
>
  <div class="scrolling-touch flex h-full max-w-2xs flex-col bg-background px-3 pt-4 pb-6">
    <div class="mb-4 shrink-0 ps-1 pt-1">
      <div class="relative">
        <SearchIcon
          class="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="text"
          placeholder="Search examples..."
          bind:value={searchQuery}
          class="h-10 ps-9"
        />
      </div>
    </div>

    <ScrollArea class="min-h-0 flex-1 pe-1">
      <div class="mb-3 pt-2">
        {#if listItems.length === 0}
          <p class="px-2 text-sm text-muted-foreground">No examples found.</p>
        {:else}
          <nav aria-label="Examples" class="space-y-2">
            {#each listItems as item (item.value)}
              <Button
                href={resolve('/examples/[name]', { name: item.value })}
                variant={page.params.name === item.value ? 'default' : 'outline'}
                class={`h-auto w-full justify-start p-3 ${
                  page.params.name === item.value ? '' : 'text-foreground'
                }`}
                onclick={closeSidebarOnMobileOnly}
              >
                {item.label}
              </Button>
            {/each}
          </nav>
        {/if}
      </div>
    </ScrollArea>
  </div>
</aside>

<svelte:window bind:innerWidth />
