<script lang="ts">
  import { useAppStore } from '$lib/store/index.svelte';
  import { createDemoTranslator } from '@chobantonov/jsonforms-svelte-demo-common';
  import { ChevronRightIcon } from '@chobantonov/jsonforms-svelte-shadcn';
  import type { Snippet } from 'svelte';
  const { library, logo }: { library: string; logo: Snippet } = $props();
  const appStore = useAppStore();
  const translate = $derived(createDemoTranslator(appStore.jsonforms.locale.value));
</script>

<section class="gradient-homepage-one min-h-[calc(100vh-var(--header-height))]">
  <div
    class="container mx-auto flex min-h-[calc(100vh-var(--header-height))] justify-center p-10 pt-20 pb-5"
  >
    <div class="grid grid-cols-1 gap-12 xl:grid-cols-[256px_800px] xl:gap-20">
      <div class="flex items-center justify-center">
        <div class="relative aspect-square size-48 md:size-64">
          {@render logo()}
          <div
            class="from-secondary to-primary absolute top-0 left-0 size-full rounded-full bg-conic opacity-50 blur-3xl"
          ></div>
        </div>
      </div>

      <div class="space-y-4 self-center text-center xl:text-start">
        <h1 class="text-foreground text-4xl font-bold md:text-5xl">
          {translate('home.welcome', undefined, { library })}
        </h1>

        <h2 class="text-muted-foreground text-3xl font-bold">{translate('home.tagline')}</h2>

        <nav class="flex flex-wrap justify-center gap-4 xl:justify-start">
          <a
            href="#/examples/spec-kitchen-sink"
            class="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium"
          >
            <span>{translate('home.open')}</span>
            <ChevronRightIcon class="size-4" />
          </a>
        </nav>
      </div>
    </div>
  </div>
</section>
