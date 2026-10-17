<script lang="ts">
  import { useAppStore } from '$lib/store/index.svelte';
  const appStore = useAppStore();
  const translate = $derived(createDemoTranslator(appStore.jsonforms.locale.value));
  import { createDemoTranslator } from '@chobantonov/jsonforms-svelte-demo-common';
  import { asset } from '$app/paths';
  import { Heading } from 'flowbite-svelte';
</script>

<div class="flex flex-col items-center justify-center gap-8 p-4">
  <div>
    <img
      src={asset('/images/flowbite-svelte-icon-logo.svg')}
      class="me-2.5 h-6 sm:h-8"
      alt="Flowbite Logo"
    />
  </div>

  <div class="space-y-3 text-center">
    <Heading tag="h1" class="text-5xl font-bold dark:text-white"
      >{translate('home.welcome', undefined, { library: 'Flowbite' })}</Heading
    >
    <Heading tag="h2" class="text-3xl font-bold dark:text-white"
      >{translate('home.tagline')}</Heading
    >
  </div>
</div>
