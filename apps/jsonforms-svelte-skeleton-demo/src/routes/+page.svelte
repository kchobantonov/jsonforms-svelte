<script lang="ts">
  import { resolve } from '$app/paths';
  import SkeletonBigLogo from '$lib/components/SkeletonBigLogo.svelte';
  import { ChevronRightIcon } from '@lucide/svelte';
</script>

<section class="gradient-homepage-one min-h-[calc(100vh-var(--header-height))]">
  <div class="container mx-auto flex min-h-[calc(100vh-var(--header-height))] justify-center p-10 pt-20 pb-5">
    <div class="grid grid-cols-1 gap-12 xl:grid-cols-[256px_800px] xl:gap-20">
      <div class="flex items-center justify-center">
        <div class="relative aspect-square size-48 md:size-64">
          <SkeletonBigLogo class="absolute left-0 top-0 z-10 size-full drop-shadow-md text-surface-950-50" />
          <div
            class="absolute left-0 top-0 size-full rounded-full bg-conic from-success-500 to-primary-500 blur-3xl"
          ></div>
        </div>
      </div>

      <div class="self-center space-y-4 text-center xl:text-left">
        <h1 class="heading-font-family text-4xl font-bold text-surface-950-50 md:text-5xl">
          Welcome to JSON Forms Svelte Skeleton
        </h1>

        <h2 class="text-3xl font-bold text-surface-700-300">More Forms. Less Code.</h2>

        <nav class="flex flex-wrap justify-center gap-4 xl:justify-start">
          <a
            href={resolve('/examples/[name]', { name: 'main' })}
            class="btn preset-filled"
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
      radial-gradient(at 24% 25%, color-mix(in oklab, var(--color-primary-500) 30%, transparent) 0px, transparent 30%),
      radial-gradient(at 35% 13%, color-mix(in oklab, var(--color-success-500) 18%, transparent) 0px, transparent 30%),
      radial-gradient(at 100% 64%, color-mix(in oklab, var(--color-error-500) 3%, transparent) 0px, transparent 40%);
  }
</style>
