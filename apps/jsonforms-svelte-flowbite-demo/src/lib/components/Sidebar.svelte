<script lang="ts">
  import {
    createDemoTranslator,
    exampleHashHref,
    filterPublicDemoExamples,
    manageNarrowDrawerFocus,
  } from '@chobantonov/jsonforms-svelte-demo-common';
  import { afterNavigate } from '$app/navigation';
  import { page } from '$app/state';
  import { useAppStore } from '$lib/store/index.svelte';
  import { createFlowbiteDemoExamples } from '@chobantonov/jsonforms-svelte-demo-common';
  import { ScrollArea } from '@chobantonov/jsonforms-svelte-flowbite';
  import {
    Select,
    Input,
    Sidebar,
    SidebarGroup,
    SidebarItem,
    SidebarWrapper,
  } from 'flowbite-svelte';
  import { SearchOutline } from 'flowbite-svelte-icons';

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
  const examples = createFlowbiteDemoExamples(() => appStore.jsonforms.locale.value);
  let innerWidth = $state(0);
  const isDesktop = $derived(innerWidth >= 1280);
  const isDrawerOpen = $derived(appStore.drawer.value);
  $effect(() => {
    if (isDesktop || !isDrawerOpen) return;
    const drawer = document.querySelector<HTMLElement>('[data-demo-examples-drawer]');
    if (!drawer) return;
    return manageNarrowDrawerFocus(
      drawer,
      document.querySelector<HTMLElement>('[data-demo-examples-trigger]'),
      { focusFirst: false, trapTab: false },
    );
  });
  const hashForLinks = $derived.by(() => {
    void page.url.hash;
    void appStore.formOnly.value;
    void appStore.activeTab.value;
    void appStore.useWebComponentView.value;
    void appStore.drawer.value;
    void appStore.jsonforms.readonly.value;
    return typeof window === 'undefined' ? page.url.hash : window.location.hash;
  });
  const closeSidebarOnMobileOnly = () => {
    if (typeof window !== 'undefined' && !window.matchMedia('(min-width: 1280px)').matches)
      appStore.drawer.value = false;
  };

  const filteredExamples = $derived(filterPublicDemoExamples(examples, exampleSource, searchQuery));

  const isActiveExample = (name: string) => page.params.name === name;

  let itemClass =
    'flex items-center p-2 text-base text-gray-900 transition duration-75 rounded-lg hover:bg-gray-100 group dark:text-gray-200 dark:hover:bg-gray-700 w-full';
  let groupClass = 'pt-2 space-y-2 mb-3';

  let currentExampleName = page.params.name;
  afterNavigate(() => {
    if (currentExampleName === page.params.name) return;
    currentExampleName = page.params.name;
    document.getElementById('svelte')?.scrollTo({ top: 0 });
    closeSidebarOnMobileOnly();
  });
</script>

<Sidebar
  data-demo-examples-drawer
  role={!isDesktop && isDrawerOpen ? 'dialog' : undefined}
  aria-modal={!isDesktop && isDrawerOpen ? 'true' : undefined}
  aria-label={translate('sidebar.examples')}
  breakpoint="xl"
  backdrop
  isOpen={!isDesktop && isDrawerOpen}
  closeSidebar={closeSidebarOnMobileOnly}
  params={{ x: appStore.rtl ? 50 : -50, duration: 50 }}
  class={`z-50 w-64 bg-gray-50 transition-transform dark:bg-gray-800 ${appStore.rtl ? '!right-0 !left-auto' : '!right-auto !left-0'} ${isDrawerOpen ? 'xl:!block' : 'xl:!hidden'}`}
  style={`top: ${headerHeight}px; height: calc(100vh - ${headerHeight}px);`}
  classes={{
    div: 'h-full bg-gray-50 px-1 py-1 dark:bg-gray-800',
    active:
      'bg-primary-600 text-white dark:bg-primary-700 hover:bg-primary-800 dark:hover:bg-primary-800',
  }}
>
  <SidebarWrapper
    class="scrolling-touch h-full max-w-2xs bg-gray-50 px-3 pt-4 pb-6 dark:bg-gray-800"
  >
    <ScrollArea class="h-full pe-1" maxHeight="100%">
      <div class="mb-4 ps-1 pt-1">
        <label class="mb-2 grid gap-1 text-sm">
          {translate('sidebar.source')}
          <Select
            bind:value={exampleSource}
            placeholder=""
            items={sourceOptions.map(({ value, label }) => ({ value, name: label }))}
            aria-label={translate('sidebar.source')}
          />
        </label>
        <Input
          type="text"
          placeholder={translate('sidebar.search')}
          aria-label={translate('sidebar.search')}
          bind:value={searchQuery}
          class="w-full pl-8"
        >
          {#snippet left()}
            <SearchOutline class="h-4 w-4" />
          {/snippet}
        </Input>
      </div>
      {#if filteredExamples.length === 0}<p class="px-2 text-sm" role="status">
          {translate('sidebar.empty')}
        </p>{/if}
      <SidebarGroup class={groupClass}>
        {#each filteredExamples as { name, label } (name)}
          <SidebarItem
            {label}
            active={isActiveExample(name)}
            href={exampleHashHref(name, hashForLinks)}
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
