<script lang="ts">
  import { useDemoSidebar, exampleHashHref } from '@chobantonov/jsonforms-svelte-demo-common';
  import { afterNavigate } from '$app/navigation';
  import { page } from '$app/state';
  import { useAppStore } from '$lib/store/index.svelte';
  import { createShadcnDemoExamples } from '@chobantonov/jsonforms-svelte-demo-common';
  import { SelectContent, SearchIcon } from '@chobantonov/jsonforms-svelte-shadcn';
  import { Button, Input, ScrollArea, Select } from '@jsonforms-svelte-shadcn-ui';

  interface Props {
    headerHeight?: number;
  }

  let { headerHeight = 70 }: Props = $props();

  const appStore = useAppStore();
  const examples = createShadcnDemoExamples(() => appStore.jsonforms.locale.value);
  const sidebar = useDemoSidebar(appStore, examples);
  const { translate, sourceOptions, listItems } = $derived(sidebar);
  const hashForLinks = $derived(sidebar.linkHash(page.url.hash));

  const onNavigate = sidebar.handleNavigation(page.params.name);
  afterNavigate(() => onNavigate(page.params.name));
</script>

{#if sidebar.mobileOpen}
  <Button
    tabindex={-1}
    aria-hidden="true"
    variant="ghost"
    class="fixed inset-0 z-30 h-auto w-auto rounded-none bg-black/45 xl:hidden"
    aria-label={translate('sidebar.close')}
    onclick={sidebar.closeOnMobile}
  />
{/if}

<aside
  bind:this={sidebar.drawerElement}
  role={sidebar.mobileOpen ? 'dialog' : undefined}
  aria-modal={sidebar.mobileOpen ? 'true' : undefined}
  aria-label={translate('sidebar.examples')}
  class={`border-border bg-background start-0 z-40 w-64 border-e transition-transform ${
    !sidebar.drawerOpen ? sidebar.drawerClosedTransform : 'translate-x-0'
  } fixed ${!sidebar.drawerOpen ? 'hidden' : ''}`}
  style={`top: ${headerHeight}px; height: calc(100vh - ${headerHeight}px);`}
>
  <div class="scrolling-touch bg-background flex h-full max-w-2xs flex-col px-3 pt-4 pb-6">
    <div class="mb-4 shrink-0 ps-1 pt-1">
      <div class="mb-2 grid min-w-0 gap-1 text-sm">
        <span>{translate('sidebar.source')}</span>
        <Select.Root type="single" bind:value={sidebar.filter.source}>
          <Select.Trigger
            class="w-full min-w-0"
            aria-label={translate('sidebar.source')}
            title={sourceOptions.find((option) => option.value === sidebar.filter.source)?.label}
          >
            <span class="min-w-0 flex-1 truncate text-start"
              >{sourceOptions.find((option) => option.value === sidebar.filter.source)?.label}</span
            >
          </Select.Trigger>
          <SelectContent
            >{#each sourceOptions as option (option.value)}
              <Select.Item value={option.value}>{option.label}</Select.Item>
            {/each}</SelectContent
          >
        </Select.Root>
      </div>
      <div class="relative">
        <SearchIcon
          class="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2"
        />
        <Input
          type="text"
          placeholder={translate('sidebar.search')}
          aria-label={translate('sidebar.search')}
          bind:value={sidebar.filter.query}
          class="h-10 ps-9"
        />
      </div>
    </div>

    <ScrollArea class="min-h-0 flex-1 pe-1">
      <div class="mb-3 pt-2">
        {#if listItems.length === 0}
          <p class="text-muted-foreground px-2 text-sm">{translate('sidebar.empty')}</p>
        {:else}
          <nav aria-label={translate('sidebar.examples')} class="space-y-2">
            {#each listItems as item (item.value)}
              <Button
                href={exampleHashHref(item.value, hashForLinks)}
                aria-current={page.params.name === item.value ? 'page' : undefined}
                variant={page.params.name === item.value ? 'default' : 'outline'}
                class={`h-auto w-full justify-start p-3 text-start whitespace-normal ${
                  page.params.name === item.value ? '' : 'text-foreground'
                }`}
                onclick={sidebar.closeOnMobile}
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

<svelte:window onkeydown={sidebar.handleDrawerKeydown} />
