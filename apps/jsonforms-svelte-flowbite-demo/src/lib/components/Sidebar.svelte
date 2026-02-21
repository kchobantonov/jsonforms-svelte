<script lang="ts">
  import { afterNavigate } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { ScrollArea } from '@chobantonov/jsonforms-svelte-flowbite';
  import { Input, Sidebar, SidebarGroup, SidebarItem, SidebarWrapper } from 'flowbite-svelte';
  import { SearchOutline } from 'flowbite-svelte-icons';
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

  let itemClass =
    'flex items-center p-2 text-base text-gray-900 transition duration-75 rounded-lg hover:bg-gray-100 group dark:text-gray-200 dark:hover:bg-gray-700 w-full';
  let groupClass = 'pt-2 space-y-2 mb-3';

  afterNavigate(() => {
    document.getElementById('svelte')?.scrollTo({ top: 0 });
    const isLargeViewport =
      typeof window !== 'undefined' && window.matchMedia('(min-width: 1280px)').matches;
    if (!isLargeViewport) {
      appStore.drawer.value = false;
    }
  });
</script>

<Sidebar
  breakpoint="xl"
  backdrop={false}
  isOpen={!isDesktop && isDrawerOpen}
  closeSidebar={closeSidebarOnMobileOnly}
  params={{ x: -50, duration: 50 }}
  class={`start-0 z-50 w-64 bg-gray-50 transition-transform dark:bg-gray-800 ${isDrawerOpen ? 'xl:!block' : 'xl:!hidden'}`}
  style={`top: ${headerHeight}px; height: calc(100vh - ${headerHeight}px);`}
  classes={{
    div: 'h-full bg-gray-50 px-1 py-1 dark:bg-gray-800',
    nonactive: 'p-2',
    active: 'p-2',
  }}
>
  <SidebarWrapper class="scrolling-touch h-full max-w-2xs bg-white px-3 pt-4 pb-6 dark:bg-gray-800">
    <ScrollArea class="h-full pe-1" maxHeight="100%">
      <div class="mb-4 ps-1 pt-1">
        <Input
          type="text"
          placeholder="Search examples..."
          bind:value={searchQuery}
          class="w-full pl-8"
        >
          {#snippet left()}
            <SearchOutline class="h-4 w-4" />
          {/snippet}
        </Input>
      </div>
      <SidebarGroup class={groupClass}>
        {#each filteredExamples as { name, label } (name)}
          <SidebarItem
            {label}
            href={resolve('/examples/[name]', { name: name })}
            spanClass="ms-3"
            class={itemClass}
            aClass="w-full p-0 py-2"
          ></SidebarItem>
        {/each}
      </SidebarGroup>
    </ScrollArea>
  </SidebarWrapper>
</Sidebar>

<svelte:window bind:innerWidth />
