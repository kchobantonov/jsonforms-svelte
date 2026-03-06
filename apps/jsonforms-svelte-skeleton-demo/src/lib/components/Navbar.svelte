<script lang="ts">
  import { resolve } from '$app/paths';
  import { Portal, Tooltip } from '@skeletonlabs/skeleton-svelte';
  import SkeletonLogo from '$lib/components/SkeletonLogo.svelte';
  import Theme from '$lib/components/Theme.svelte';
  import WebComponentLogo from '$lib/components/WebComponentLogo.svelte';
  import { useAppStore } from '$lib/store/index.svelte';
  import {
    GithubIcon,
    MenuIcon,
    PanelsTopLeftIcon,
    Settings2Icon,
  } from '@lucide/svelte';

  const appStore = useAppStore();

  const systemPrefersDark = $derived.by(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches,
  );
  const effectiveDark = $derived.by(() =>
    appStore.mode.value === 'dark' || (appStore.mode.value === 'system' && systemPrefersDark),
  );
</script>

<header class="border-b border-surface-200-800 bg-surface-50-950/92 backdrop-blur-xl">
  <div class="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3">
    <div class="flex items-center gap-2">
      <Tooltip positioning={{ placement: 'bottom' }}>
        <Tooltip.Trigger
          class="btn hover:preset-tonal px-2"
          aria-label={appStore.drawer.value ? 'Hide example menu' : 'Show example menu'}
          onclick={() => (appStore.drawer.value = !appStore.drawer.value)}
        >
          <MenuIcon class="size-4" />
        </Tooltip.Trigger>
        <Portal>
          <Tooltip.Positioner class="z-60">
            <Tooltip.Content class="card bg-surface-50-950 border border-surface-200-800 p-2 shadow-xl">
              {appStore.drawer.value ? 'Hide example menu' : 'Show example menu'}
            </Tooltip.Content>
          </Tooltip.Positioner>
        </Portal>
      </Tooltip>

      <a href={resolve('/')} class="flex min-w-0 items-center gap-3">
        <SkeletonLogo
          width={32}
          height={32}
          class="fill-current text-surface-950-50 transition-transform duration-200 hover:rotate-[-10deg]"
        />
        <p class="truncate text-base font-semibold text-surface-950-50 sm:text-lg">
          JSON Forms Skeleton Svelte
        </p>
      </a>
    </div>

    <nav class="ml-auto flex items-center gap-1">
      <Tooltip positioning={{ placement: 'bottom' }}>
        <Tooltip.Trigger
          class="btn hover:preset-tonal px-2"
          aria-label={appStore.formOnly.value ? 'Show full UI' : 'Show form only'}
          onclick={() => (appStore.formOnly.value = !appStore.formOnly.value)}
        >
          <PanelsTopLeftIcon class="size-4" />
        </Tooltip.Trigger>
        <Portal>
          <Tooltip.Positioner class="z-60">
            <Tooltip.Content class="card bg-surface-50-950 border border-surface-200-800 p-2 shadow-xl">
              {appStore.formOnly.value ? 'Show full UI' : 'Show form only'}
            </Tooltip.Content>
          </Tooltip.Positioner>
        </Portal>
      </Tooltip>

      <Tooltip positioning={{ placement: 'bottom' }}>
        <Tooltip.Trigger
          class="btn hover:preset-tonal px-2"
          aria-label={appStore.useWebComponentView.value
            ? 'Using web component renderer'
            : 'Using Svelte renderer'}
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
            <Tooltip.Content class="card bg-surface-50-950 border border-surface-200-800 p-2 shadow-xl">
              {appStore.useWebComponentView.value ? 'Web component renderer' : 'Svelte renderer'}
            </Tooltip.Content>
          </Tooltip.Positioner>
        </Portal>
      </Tooltip>

      <Tooltip positioning={{ placement: 'bottom' }}>
        <Tooltip.Trigger
          class="btn hover:preset-tonal px-2"
          aria-label="GitHub"
          onclick={() => window.open('https://github.com/kchobantonov/jsonforms-svelte', '_blank', 'noopener,noreferrer')}
        >
          <GithubIcon class="size-4" />
        </Tooltip.Trigger>
        <Portal>
          <Tooltip.Positioner class="z-60">
            <Tooltip.Content class="card bg-surface-50-950 border border-surface-200-800 p-2 shadow-xl">
              GitHub
            </Tooltip.Content>
          </Tooltip.Positioner>
        </Portal>
      </Tooltip>

      <Theme />

      <Tooltip positioning={{ placement: 'bottom' }}>
        <Tooltip.Trigger
          class="btn hover:preset-tonal px-2"
          aria-label={appStore.settings ? 'Close settings' : 'Open settings'}
          onclick={() => (appStore.settings = !appStore.settings)}
        >
          <Settings2Icon class="size-4" />
        </Tooltip.Trigger>
        <Portal>
          <Tooltip.Positioner class="z-60">
            <Tooltip.Content class="card bg-surface-50-950 border border-surface-200-800 p-2 shadow-xl">
              {appStore.settings ? 'Close settings' : 'Open settings'}
            </Tooltip.Content>
          </Tooltip.Positioner>
        </Portal>
      </Tooltip>
    </nav>
  </div>
</header>
