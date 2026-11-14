<script lang="ts">
  import { createDemoTranslator } from '@chobantonov/jsonforms-svelte-demo-common';
  import SkeletonLogo from '$lib/components/SkeletonLogo.svelte';
  import Theme from '$lib/components/Theme.svelte';
  import WebComponentLogo from '$lib/components/WebComponentLogo.svelte';
  import { useAppStore } from '$lib/store/index.svelte';
  import { GithubIcon, MenuIcon, PanelsTopLeftIcon, Settings2Icon } from '@lucide/svelte';
  import { Portal, Tooltip } from '@skeletonlabs/skeleton-svelte';

  const appStore = useAppStore();
  const translate = $derived(createDemoTranslator(appStore.jsonforms.locale.value));

  const systemPrefersDark = $derived.by(
    () =>
      typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches,
  );
  const effectiveDark = $derived.by(
    () => appStore.mode.value === 'dark' || (appStore.mode.value === 'system' && systemPrefersDark),
  );
</script>

<header class="border-surface-200-800 bg-surface-50-950/92 border-b backdrop-blur-xl">
  <div class="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3">
    <div class="flex items-center gap-2">
      {#if !appStore.formOnly.value}
        <Tooltip positioning={{ placement: 'bottom' }}>
          <Tooltip.Trigger
            data-demo-examples-trigger
            class="btn hover:preset-tonal px-2"
            aria-label={appStore.drawer.value
              ? translate('nav.hideExamples')
              : translate('nav.showExamples')}
            aria-expanded={appStore.drawer.value}
            onclick={() => (appStore.drawer.value = !appStore.drawer.value)}
          >
            <MenuIcon class="size-4" />
          </Tooltip.Trigger>
          <Portal>
            <Tooltip.Positioner class="z-60">
              <Tooltip.Content
                class="card border-surface-200-800 bg-surface-50-950 border p-2 shadow-xl"
              >
                {appStore.drawer.value
                  ? translate('nav.hideExamples')
                  : translate('nav.showExamples')}
              </Tooltip.Content>
            </Tooltip.Positioner>
          </Portal>
        </Tooltip>
      {/if}

      <a href="#/" aria-label="JSON Forms Skeleton Svelte" class="flex min-w-0 items-center gap-3">
        <SkeletonLogo
          width={32}
          height={32}
          class="text-surface-950-50 fill-current transition-transform duration-200 hover:rotate-[-10deg]"
        />
        <p class="text-surface-950-50 hidden truncate text-base font-semibold sm:block sm:text-lg">
          JSON Forms Skeleton Svelte
        </p>
      </a>
    </div>

    <nav class="ms-auto flex items-center gap-1">
      <Tooltip positioning={{ placement: 'bottom' }}>
        <Tooltip.Trigger
          class="btn hover:preset-tonal px-2"
          aria-label={appStore.formOnly.value
            ? translate('nav.showFullUi')
            : translate('nav.showFormOnly')}
          aria-pressed={appStore.formOnly.value}
          onclick={() => (appStore.formOnly.value = !appStore.formOnly.value)}
        >
          <PanelsTopLeftIcon class="size-4" />
        </Tooltip.Trigger>
        <Portal>
          <Tooltip.Positioner class="z-60">
            <Tooltip.Content
              class="card border-surface-200-800 bg-surface-50-950 border p-2 shadow-xl"
            >
              {appStore.formOnly.value
                ? translate('nav.showFullUi')
                : translate('nav.showFormOnly')}
            </Tooltip.Content>
          </Tooltip.Positioner>
        </Portal>
      </Tooltip>

      <Tooltip positioning={{ placement: 'bottom' }}>
        <Tooltip.Trigger
          class="btn hover:preset-tonal px-2"
          aria-label={appStore.useWebComponentView.value
            ? translate('nav.webComponent')
            : translate('nav.svelte')}
          aria-pressed={appStore.useWebComponentView.value}
          onclick={() => (appStore.useWebComponentView.value = !appStore.useWebComponentView.value)}
        >
          <WebComponentLogo
            width={18}
            height={18}
            animate={appStore.useWebComponentView.value}
            onSurfaceColor={effectiveDark ? '#F9FAFB' : '#111827'}
          />
        </Tooltip.Trigger>
        <Portal>
          <Tooltip.Positioner class="z-60">
            <Tooltip.Content
              class="card border-surface-200-800 bg-surface-50-950 border p-2 shadow-xl"
            >
              {appStore.useWebComponentView.value
                ? translate('nav.webComponent')
                : translate('nav.svelte')}
            </Tooltip.Content>
          </Tooltip.Positioner>
        </Portal>
      </Tooltip>

      <Tooltip positioning={{ placement: 'bottom' }}>
        <Tooltip.Trigger
          class="btn hover:preset-tonal px-2"
          aria-label={translate('nav.github')}
          onclick={() =>
            window.open(
              'https://github.com/kchobantonov/jsonforms-svelte',
              '_blank',
              'noopener,noreferrer',
            )}
        >
          <GithubIcon class="size-4" />
        </Tooltip.Trigger>
        <Portal>
          <Tooltip.Positioner class="z-60">
            <Tooltip.Content
              class="card border-surface-200-800 bg-surface-50-950 border p-2 shadow-xl"
            >
              {translate('nav.github')}
            </Tooltip.Content>
          </Tooltip.Positioner>
        </Portal>
      </Tooltip>

      <Theme />

      {#if !appStore.formOnly.value}
        <Tooltip positioning={{ placement: 'bottom' }}>
          <Tooltip.Trigger
            class="btn hover:preset-tonal px-2"
            data-demo-settings-trigger
            aria-label={appStore.settings
              ? translate('nav.closeSettings')
              : translate('nav.openSettings')}
            aria-expanded={appStore.settings}
            onclick={() => (appStore.settings = !appStore.settings)}
          >
            <Settings2Icon class="size-4" />
          </Tooltip.Trigger>
          <Portal>
            <Tooltip.Positioner class="z-60">
              <Tooltip.Content
                class="card border-surface-200-800 bg-surface-50-950 border p-2 shadow-xl"
              >
                {appStore.settings ? translate('nav.closeSettings') : translate('nav.openSettings')}
              </Tooltip.Content>
            </Tooltip.Positioner>
          </Portal>
        </Tooltip>
      {/if}
    </nav>
  </div>
</header>
