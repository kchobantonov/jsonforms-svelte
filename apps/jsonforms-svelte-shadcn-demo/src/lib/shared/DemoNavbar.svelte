<script lang="ts">
  import { useDemoNavbar } from '@chobantonov/jsonforms-svelte-demo-common';
  import type { Snippet } from 'svelte';
  import Theme from '$shadcnDemo/Theme.svelte';
  import { WebComponentLogo } from '@chobantonov/jsonforms-svelte-demo-common';
  import { useAppStore } from '$lib/store/index.svelte';
  import {
    GithubIcon,
    MenuIcon,
    PanelsTopLeftIcon,
    Settings2Icon,
  } from '@chobantonov/jsonforms-svelte-shadcn';
  import { buttonVariants, Tooltip } from '@jsonforms-svelte-shadcn-ui';

  const { title, logo }: { title: string; logo: Snippet } = $props();
  const appStore = useAppStore();
  const nav = useDemoNavbar(appStore);
  const toolbarButtonClass = buttonVariants({ variant: 'ghost', size: 'icon-lg' });
</script>

<header class="design-menu-target border-border bg-background/95 border-b backdrop-blur-xl">
  <Tooltip.Provider>
    <div class="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3">
      <div class="flex items-center gap-2">
        {#if !appStore.formOnly.value}
          <Tooltip.Root>
            <Tooltip.Trigger
              data-demo-examples-trigger
              class={`${toolbarButtonClass} ${appStore.drawer.value ? 'bg-muted text-foreground' : ''}`}
              {...nav.drawer}
            >
              <MenuIcon class="size-4" />
            </Tooltip.Trigger>
            <Tooltip.Content side="bottom">
              {nav.drawer['aria-label']}
            </Tooltip.Content>
          </Tooltip.Root>
        {/if}

        <a href="#/" aria-label={title} class="flex min-w-0 items-center gap-3">
          {@render logo()}
          <p class="text-foreground hidden truncate text-base font-semibold sm:block sm:text-lg">
            {title}
          </p>
        </a>
      </div>

      <nav class="ms-auto flex items-center gap-1">
        <Tooltip.Root>
          <Tooltip.Trigger
            class={`${toolbarButtonClass} ${appStore.formOnly.value ? 'bg-muted text-foreground' : ''}`}
            {...nav.formOnly}
          >
            <PanelsTopLeftIcon class="size-4" />
          </Tooltip.Trigger>
          <Tooltip.Content side="bottom">
            {nav.formOnly['aria-label']}
          </Tooltip.Content>
        </Tooltip.Root>

        <Tooltip.Root>
          <Tooltip.Trigger
            class={`${toolbarButtonClass} ${appStore.useWebComponentView.value ? 'bg-muted text-foreground' : ''}`}
            {...nav.renderer}
          >
            <WebComponentLogo width={18} height={18} {...nav.logo} />
          </Tooltip.Trigger>
          <Tooltip.Content side="bottom">
            {nav.renderer['aria-label']}
          </Tooltip.Content>
        </Tooltip.Root>

        <Tooltip.Root>
          <Tooltip.Trigger
            class={toolbarButtonClass}
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
          <Tooltip.Content side="bottom">{nav.translate('nav.github')}</Tooltip.Content>
        </Tooltip.Root>

        <Theme />

        {#if !appStore.formOnly.value}
          <Tooltip.Root>
            <Tooltip.Trigger
              class={`${toolbarButtonClass} ${appStore.settings ? 'bg-muted text-foreground' : ''}`}
              {...nav.settings}
            >
              <Settings2Icon class="size-4" />
            </Tooltip.Trigger>
            <Tooltip.Content side="bottom">
              {nav.settings['aria-label']}
            </Tooltip.Content>
          </Tooltip.Root>
        {/if}
      </nav>
    </div>
  </Tooltip.Provider>
</header>
