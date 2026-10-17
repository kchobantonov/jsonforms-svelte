<script lang="ts">
  import { createDemoTranslator } from '@chobantonov/jsonforms-svelte-demo-common';
  import { asset } from '$app/paths';
  import WebComponentLogo from '$lib/components/WebComponentLogo.svelte';
  import {
    appThemeColorPreview,
    appThemeColors,
    useAppStore,
    type AppThemeColor,
  } from '$lib/store/index.svelte';
  import { DarkMode } from '@chobantonov/jsonforms-svelte-flowbite';
  import {
    Dropdown,
    DropdownItem,
    NavBrand,
    Navbar,
    ToolbarButton,
    Tooltip,
  } from 'flowbite-svelte';
  import { CogOutline, RestoreWindowOutline } from 'flowbite-svelte-icons';

  const appStore = useAppStore();
  const translate = $derived(createDemoTranslator(appStore.jsonforms.locale.value));
  let themeMenuOpen = $state(false);
  let prefersDark = $state(false);
  const themeColorTriggerId = 'theme-color-trigger';
  const isDark = $derived(
    appStore.mode.value === 'dark' || (appStore.mode.value === 'system' && prefersDark),
  );

  const selectThemeColor = (themeColor: AppThemeColor): void => {
    appStore.themeColor.value = themeColor;
    themeMenuOpen = false;
  };

  $effect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    prefersDark = mediaQuery.matches;

    const onChange = (event: MediaQueryListEvent) => {
      prefersDark = event.matches;
    };

    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  });
</script>

<Navbar class="px-2 sm:px-4">
  <ToolbarButton
    size="lg"
    class="-mx-0.5 me-1 hover:text-gray-900 dark:hover:text-white"
    onclick={() => (appStore.drawer.value = !appStore.drawer.value)}
    title={appStore.drawer.value ? translate('nav.hideExamples') : translate('nav.showExamples')}
  >
    <svg aria-hidden="true" class="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
      />
    </svg>
    <span class="sr-only"
      >{appStore.drawer.value ? translate('nav.hideExamples') : translate('nav.showExamples')}</span
    >
  </ToolbarButton>
  <NavBrand href="#/" class="mx-10">
    <img
      src={asset('/images/flowbite-svelte-icon-logo.svg')}
      class="me-2.5 h-6 sm:h-8"
      alt="Flowbite Logo"
    />
    <span
      class="ml-px self-center text-xl font-semibold whitespace-nowrap sm:text-2xl dark:text-white"
    >
      JSON Forms Flowbite Svelte
    </span>
  </NavBrand>
  <div class="ms-auto flex items-center text-gray-500 sm:order-2 dark:text-gray-300">
    <ToolbarButton
      size="lg"
      class="-mx-0.5 hover:text-gray-900 dark:hover:text-white"
      onclick={() => (appStore.formOnly.value = !appStore.formOnly.value)}
      aria-label={appStore.formOnly.value
        ? translate('nav.showFullUi')
        : translate('nav.showFormOnly')}
    >
      <RestoreWindowOutline class="h-5 w-5"></RestoreWindowOutline>
    </ToolbarButton>
    <Tooltip
      >{appStore.formOnly.value
        ? translate('nav.showFullUi')
        : translate('nav.showFormOnly')}</Tooltip
    >
    <ToolbarButton
      size="lg"
      class="-mx-0.5 hover:text-gray-900 dark:hover:text-white"
      onclick={() => (appStore.useWebComponentView.value = !appStore.useWebComponentView.value)}
    >
      <WebComponentLogo
        width={20}
        height={20}
        animate={appStore.useWebComponentView.value}
        onSurfaceColor={isDark ? '#F9FAFB' : '#111827'}
      />
      <span class="sr-only"
        >{appStore.useWebComponentView.value
          ? translate('nav.webComponent')
          : translate('nav.svelte')}</span
      >
    </ToolbarButton>
    <Tooltip
      >{appStore.useWebComponentView.value
        ? translate('nav.webComponent')
        : translate('nav.svelte')}</Tooltip
    >
    <ToolbarButton
      size="lg"
      href="https://github.com/kchobantonov/jsonforms-svelte"
      target="_blank"
      class="-mx-0.5 hover:text-gray-900 dark:hover:text-white"
    >
      <svg aria-hidden="true" class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path
          fill-rule="evenodd"
          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
          clip-rule="evenodd"
        />
      </svg>
      <span class="sr-only">Github</span>
    </ToolbarButton>
    <Tooltip>{translate('nav.github')}</Tooltip>
    <ToolbarButton
      id={themeColorTriggerId}
      size="lg"
      class="-mx-0.5 hover:text-gray-900 dark:hover:text-white"
    >
      <svg aria-hidden="true" class="h-5 w-5" fill="none" viewBox="0 0 24 24">
        <path
          d="M12 3a9 9 0 1 0 9 9v-.03a2.49 2.49 0 0 0-2.5-2.47H17a2 2 0 0 1-2-2V6a3 3 0 0 0-3-3Z"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <circle cx="6.75" cy="12" r="1.1" fill="currentColor" />
        <circle cx="10" cy="8.2" r="1.1" fill="currentColor" />
        <circle cx="14.25" cy="15.75" r="1.1" fill="currentColor" />
        <circle
          cx="17.5"
          cy="18.2"
          r="3"
          style={`fill: ${appThemeColorPreview[appStore.themeColor.value]};`}
          stroke="currentColor"
          stroke-width="1"
        />
      </svg>
      <span class="sr-only">{translate('nav.themeColor')}</span>
    </ToolbarButton>
    <Tooltip
      >{translate('nav.currentThemeColor', undefined, {
        color: translate('theme.' + appStore.themeColor.value),
      })}</Tooltip
    >
    <Dropdown
      triggeredBy={`#${themeColorTriggerId}`}
      placement="bottom-end"
      bind:isOpen={themeMenuOpen}
      class="w-44"
    >
      {#each appThemeColors as themeColor (themeColor)}
        <DropdownItem liClass="list-none" onclick={() => selectThemeColor(themeColor)}>
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <span
                class="h-2.5 w-2.5 rounded-full border border-gray-300 dark:border-gray-500"
                style={`background-color: ${appThemeColorPreview[themeColor]};`}
              ></span>
              <span>{translate('theme.' + themeColor)}</span>
            </div>
            {#if appStore.themeColor.value === themeColor}
              <span class="text-primary-600 dark:text-primary-400">●</span>
            {/if}
          </div>
        </DropdownItem>
      {/each}
    </Dropdown>
    <DarkMode
      bind:mode={appStore.mode.value}
      ariaLabel={isDark ? translate('nav.lightMode') : translate('nav.darkMode')}
    />
    <Tooltip>{isDark ? translate('nav.lightMode') : translate('nav.darkMode')}</Tooltip>
    <ToolbarButton
      size="lg"
      class="-mx-0.5 hover:text-gray-900 dark:hover:text-white"
      onclick={() => (appStore.settings = !appStore.settings)}
      aria-label={appStore.settings
        ? translate('nav.closeSettings')
        : translate('nav.openSettings')}
    >
      <CogOutline class="h-5 w-5"></CogOutline>
    </ToolbarButton>
    <Tooltip
      >{appStore.settings ? translate('nav.closeSettings') : translate('nav.openSettings')}</Tooltip
    >
  </div></Navbar
>
