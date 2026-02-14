<script lang="ts">
  import { afterNavigate } from '$app/navigation';
  import { resolve } from '$app/paths';
  import {
    Input,
    Sidebar,
    SidebarButton,
    SidebarGroup,
    SidebarItem,
    SidebarWrapper,
    uiHelpers,
  } from 'flowbite-svelte';
  import { SearchOutline } from 'flowbite-svelte-icons';

  import examples from '$lib/examples';

  interface Props {
    drawerHidden: boolean;
  }
  let { drawerHidden = $bindable(false) }: Props = $props();

  let searchQuery = $state('');

  const filteredExamples = $derived.by(() => {
    if (!searchQuery.trim()) return examples;

    const query = searchQuery.toLowerCase();
    return examples.filter(
      ({ name, label }) =>
        name.toLowerCase().includes(query) || label.toLowerCase().includes(query),
    );
  });

  const closeDrawer = () => {
    drawerHidden = true;
  };

  let itemClass =
    'flex items-center p-2 text-base text-gray-900 transition duration-75 rounded-lg hover:bg-gray-100 group dark:text-gray-200 dark:hover:bg-gray-700 w-full';
  let groupClass = 'pt-2 space-y-2 mb-3';

  const sidebarUi = uiHelpers();
  let isOpen = $state(false);
  const closeSidebar = sidebarUi.close;
  $effect(() => {
    isOpen = sidebarUi.isOpen;
  });

  afterNavigate(() => {
    document.getElementById('svelte')?.scrollTo({ top: 0 });
    closeDrawer();
  });
</script>

<SidebarButton breakpoint="lg" onclick={sidebarUi.toggle} class="fixed top-[22px] z-40 mb-2" />
<Sidebar
  breakpoint="lg"
  backdrop={false}
  {isOpen}
  {closeSidebar}
  params={{ x: -50, duration: 50 }}
  class="top-0 left-0 mt-[69px] h-screen w-64 bg-gray-50 transition-transform lg:block dark:bg-gray-800"
  classes={{
    div: 'h-full px-1 py-1 overflow-y-auto bg-gray-50 dark:bg-gray-800',
    nonactive: 'p-2',
    active: 'p-2',
  }}
>
  <SidebarWrapper
    class="scrolling-touch h-full max-w-2xs overflow-y-auto bg-white px-3 pt-20 lg:sticky lg:me-0 lg:block lg:h-[calc(100vh-4rem)] lg:pt-5 dark:bg-gray-800"
  >
    <div class="mb-4">
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
          spanClass="ml-3"
          class={itemClass}
          aClass="w-full p-0 py-2"
        ></SidebarItem>
      {/each}
    </SidebarGroup>
  </SidebarWrapper>
</Sidebar>
