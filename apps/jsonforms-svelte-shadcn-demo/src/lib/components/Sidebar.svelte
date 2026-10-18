<script lang="ts">
  import {
    createDemoTranslator,
    filterPublicDemoExamples,
  } from '@chobantonov/jsonforms-svelte-demo-common';
  import { afterNavigate } from '$app/navigation';
  import { page } from '$app/state';
  import { useAppStore } from '$lib/store/index.svelte';
  import { createShadcnDemoExamples } from '@chobantonov/jsonforms-svelte-demo-common';
  import { SearchIcon } from '@chobantonov/jsonforms-svelte-shadcn';
  import { Button, Input, ScrollArea, Select } from '$lib/components/ui';

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

  const filteredExamples = $derived(filterPublicDemoExamples(examples, exampleSource, searchQuery));

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
    aria-label={translate('sidebar.close')}
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
      <div class="mb-2 grid min-w-0 gap-1 text-sm">
        <span>{translate('sidebar.source')}</span>
        <Select.Root type="single" bind:value={exampleSource}>
          <Select.Trigger
            class="w-full min-w-0"
            aria-label={translate('sidebar.source')}
            title={sourceOptions.find((option) => option.value === exampleSource)?.label}
          >
            <span class="min-w-0 flex-1 truncate text-start"
              >{sourceOptions.find((option) => option.value === exampleSource)?.label}</span
            >
          </Select.Trigger>
          <Select.Content
            >{#each sourceOptions as option (option.value)}
              <Select.Item value={option.value}>{option.label}</Select.Item>
            {/each}</Select.Content
          >
        </Select.Root>
      </div>
      <div class="relative">
        <SearchIcon
          class="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="text"
          placeholder={translate('sidebar.search')}
          aria-label={translate('sidebar.search')}
          bind:value={searchQuery}
          class="h-10 ps-9"
        />
      </div>
    </div>

    <ScrollArea class="min-h-0 flex-1 pe-1">
      <div class="mb-3 pt-2">
        {#if listItems.length === 0}
          <p class="px-2 text-sm text-muted-foreground">{translate('sidebar.empty')}</p>
        {:else}
          <nav aria-label={translate('sidebar.examples')} class="space-y-2">
            {#each listItems as item (item.value)}
              <Button
                href={`#/examples/${encodeURIComponent(item.value)}`}
                variant={page.params.name === item.value ? 'default' : 'outline'}
                class={`h-auto w-full justify-start p-3 text-start whitespace-normal ${
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
