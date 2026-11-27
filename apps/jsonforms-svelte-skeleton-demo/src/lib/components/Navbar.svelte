<script lang="ts">
  import { useDemoNavbar } from '@chobantonov/jsonforms-svelte-demo-common';
  import SkeletonLogo from '$lib/components/SkeletonLogo.svelte';
  import Theme from '$lib/components/Theme.svelte';
  import { WebComponentLogo } from '@chobantonov/jsonforms-svelte-demo-common';
  import { useAppStore } from '$lib/store/index.svelte';
  import { GithubIcon, MenuIcon, PanelsTopLeftIcon, Settings2Icon } from '@lucide/svelte';
  import { Portal, Tooltip } from '@skeletonlabs/skeleton-svelte';

  const appStore = useAppStore();
  const nav = useDemoNavbar(appStore);
</script>

<header class="border-surface-200-800 bg-surface-50-950/92 border-b backdrop-blur-xl">
  <div class="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3">
    <div class="flex items-center gap-2">
      {#if !appStore.formOnly.value}
        <Tooltip positioning={{ placement: 'bottom' }}>
          <Tooltip.Trigger
            data-demo-examples-trigger
            class="btn hover:preset-tonal px-2"
            {...nav.drawer}
          >
            <MenuIcon class="size-4" />
          </Tooltip.Trigger>
          <Portal>
            <Tooltip.Positioner class="z-60">
              <Tooltip.Content
                class="card border-surface-200-800 bg-surface-50-950 border p-2 shadow-xl"
              >
                {nav.drawer['aria-label']}
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
        <Tooltip.Trigger class="btn hover:preset-tonal px-2" {...nav.formOnly}>
          <PanelsTopLeftIcon class="size-4" />
        </Tooltip.Trigger>
        <Portal>
          <Tooltip.Positioner class="z-60">
            <Tooltip.Content
              class="card border-surface-200-800 bg-surface-50-950 border p-2 shadow-xl"
            >
              {nav.formOnly['aria-label']}
            </Tooltip.Content>
          </Tooltip.Positioner>
        </Portal>
      </Tooltip>

      <Tooltip positioning={{ placement: 'bottom' }}>
        <Tooltip.Trigger class="btn hover:preset-tonal px-2" {...nav.renderer}>
          <WebComponentLogo width={18} height={18} {...nav.logo} />
        </Tooltip.Trigger>
        <Portal>
          <Tooltip.Positioner class="z-60">
            <Tooltip.Content
              class="card border-surface-200-800 bg-surface-50-950 border p-2 shadow-xl"
            >
              {nav.renderer['aria-label']}
            </Tooltip.Content>
          </Tooltip.Positioner>
        </Portal>
      </Tooltip>

      <Tooltip positioning={{ placement: 'bottom' }}>
        <Tooltip.Trigger
          class="btn hover:preset-tonal px-2"
          aria-label={nav.translate('nav.github')}
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
              {nav.translate('nav.github')}
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
            {...nav.settings}
          >
            <Settings2Icon class="size-4" />
          </Tooltip.Trigger>
          <Portal>
            <Tooltip.Positioner class="z-60">
              <Tooltip.Content
                class="card border-surface-200-800 bg-surface-50-950 border p-2 shadow-xl"
              >
                {nav.settings['aria-label']}
              </Tooltip.Content>
            </Tooltip.Positioner>
          </Portal>
        </Tooltip>
      {/if}
    </nav>
  </div>
</header>
