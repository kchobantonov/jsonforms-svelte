<script lang="ts">
  import { resolve } from '$app/paths';
  import ShadcnLogo from '$lib/components/ShadcnLogo.svelte';
  import Theme from '$lib/components/Theme.svelte';
  import WebComponentLogo from '$lib/components/WebComponentLogo.svelte';
  import { useAppStore } from '$lib/store/index.svelte';
  import { GithubIcon, MenuIcon, PanelsTopLeftIcon, Settings2Icon } from '@lucide/svelte';
  import { Tooltip } from '@chobantonov/jsonforms-svelte-shadcn';

  const appStore = useAppStore();

  const systemPrefersDark = $derived.by(
    () =>
      typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches,
  );
  const effectiveDark = $derived.by(
    () => appStore.mode.value === 'dark' || (appStore.mode.value === 'system' && systemPrefersDark),
  );
</script>

<header class="border-b border-border bg-background/95 backdrop-blur-xl">
  <Tooltip.Provider>
    <div class="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3">
      <div class="flex items-center gap-2">
        <Tooltip.Root>
          <Tooltip.Trigger
            class="size-9 px-0 hover:bg-accent"
            aria-label={appStore.drawer.value ? 'Hide example menu' : 'Show example menu'}
            onclick={() => (appStore.drawer.value = !appStore.drawer.value)}
          >
            <MenuIcon class="size-4" />
          </Tooltip.Trigger>
          <Tooltip.Content side="bottom">
            {appStore.drawer.value ? 'Hide example menu' : 'Show example menu'}
          </Tooltip.Content>
        </Tooltip.Root>

        <a href={resolve('/')} class="flex min-w-0 items-center gap-3">
          <ShadcnLogo
            width={32}
            height={32}
            class="text-foreground transition-transform duration-200 hover:rotate-[-10deg]"
          />
          <p class="truncate text-base font-semibold text-foreground sm:text-lg">
            JSON Forms Shadcn Svelte
          </p>
        </a>
      </div>

      <nav class="ms-auto flex items-center gap-1">
        <Tooltip.Root>
          <Tooltip.Trigger
            class="size-9 px-0 hover:bg-accent"
            aria-label={appStore.formOnly.value ? 'Show full UI' : 'Show form only'}
            onclick={() => (appStore.formOnly.value = !appStore.formOnly.value)}
          >
            <PanelsTopLeftIcon class="size-4" />
          </Tooltip.Trigger>
          <Tooltip.Content side="bottom">
            {appStore.formOnly.value ? 'Show full UI' : 'Show form only'}
          </Tooltip.Content>
        </Tooltip.Root>

        <Tooltip.Root>
          <Tooltip.Trigger
            class="size-9 px-0 hover:bg-accent"
            aria-label={appStore.useWebComponentView.value
              ? 'Using web component renderer'
              : 'Using Svelte renderer'}
            onclick={() =>
              (appStore.useWebComponentView.value = !appStore.useWebComponentView.value)}
          >
            <WebComponentLogo
              width={18}
              height={18}
              animate={appStore.useWebComponentView.value}
              onSurfaceColor={effectiveDark ? '#F9FAFB' : '#111827'}
            />
          </Tooltip.Trigger>
          <Tooltip.Content side="bottom">
            {appStore.useWebComponentView.value ? 'Web component renderer' : 'Svelte renderer'}
          </Tooltip.Content>
        </Tooltip.Root>

        <Tooltip.Root>
          <Tooltip.Trigger
            class="size-9 px-0 hover:bg-accent"
            aria-label="GitHub"
            onclick={() =>
              window.open(
                'https://github.com/kchobantonov/jsonforms-svelte',
                '_blank',
                'noopener,noreferrer',
              )}
          >
            <GithubIcon class="size-4" />
          </Tooltip.Trigger>
          <Tooltip.Content side="bottom">GitHub</Tooltip.Content>
        </Tooltip.Root>

        <Theme />

        <Tooltip.Root>
          <Tooltip.Trigger
            class="size-9 px-0 hover:bg-accent"
            aria-label={appStore.settings ? 'Close settings' : 'Open settings'}
            onclick={() => (appStore.settings = !appStore.settings)}
          >
            <Settings2Icon class="size-4" />
          </Tooltip.Trigger>
          <Tooltip.Content side="bottom">
            {appStore.settings ? 'Close settings' : 'Open settings'}
          </Tooltip.Content>
        </Tooltip.Root>
      </nav>
    </div>
  </Tooltip.Provider>
</header>
