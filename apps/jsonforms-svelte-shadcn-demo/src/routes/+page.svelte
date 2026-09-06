<script lang="ts">
  import { resolve } from '$app/paths';
  import ShadcnBigLogo from '$lib/components/ShadcnBigLogo.svelte';
  import { ChevronRightIcon } from '@chobantonov/jsonforms-svelte-shadcn';
</script>

<section class="gradient-homepage-one min-h-[calc(100vh-var(--header-height))]">
  <div
    class="container mx-auto flex min-h-[calc(100vh-var(--header-height))] justify-center p-10 pt-20 pb-5"
  >
    <div class="grid grid-cols-1 gap-12 xl:grid-cols-[256px_800px] xl:gap-20">
      <div class="flex items-center justify-center">
        <div class="relative aspect-square size-48 md:size-64">
          <ShadcnBigLogo
            class="absolute top-0 left-0 z-10 size-full text-foreground drop-shadow-md"
          />
          <div
            class="absolute top-0 left-0 size-full rounded-full bg-conic from-secondary to-primary opacity-50 blur-3xl"
          ></div>
        </div>
      </div>

      <div class="space-y-4 self-center text-center xl:text-start">
        <h1 class="text-4xl font-bold text-foreground md:text-5xl">
          Welcome to JSON Forms Svelte Shadcn
        </h1>

        <h2 class="text-3xl font-bold text-muted-foreground">More Forms. Less Code.</h2>

        <nav class="flex flex-wrap justify-center gap-4 xl:justify-start">
          <a
            href={resolve('/examples/[name]', { name: 'main' })}
            class="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <span>Open Demo</span>
            <ChevronRightIcon class="size-4" />
          </a>
        </nav>
      </div>
    </div>
  </div>
</section>

<style>
  .gradient-homepage-one {
    background-size: cover;
    background-image:
      radial-gradient(
        at 24% 25%,
        color-mix(in oklab, hsl(var(--primary)) 30%, transparent) 0px,
        transparent 30%
      ),
      radial-gradient(
        at 35% 13%,
        color-mix(in oklab, hsl(var(--secondary)) 18%, transparent) 0px,
        transparent 30%
      ),
      radial-gradient(
        at 100% 64%,
        color-mix(in oklab, hsl(var(--destructive)) 3%, transparent) 0px,
        transparent 40%
      );
  }
</style>
