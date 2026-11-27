<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { useExamplePage } from '../core/examplePage.svelte';
  import type { DemoExample } from '../examples/definitions';
  import { createDemoTranslator } from '../i18n/demo';
  import DemoPageHead from './DemoPageHead.svelte';
  import SpecSourceLink from './SpecSourceLink.svelte';
  import PlaygroundConfiguration from './PlaygroundConfiguration.svelte';
  const {
    model,
    name,
    library,
    locale,
    formOnly,
    wideHeading,
    dir,
    errorClass,
    titleClass,
    toastClass,
    children,
  }: {
    model: ReturnType<typeof useExamplePage>;
    name?: string;
    library: string;
    locale: string;
    formOnly: boolean;
    wideHeading: boolean;
    dir?: 'ltr' | 'rtl';
    errorClass: string;
    titleClass: string;
    toastClass: string;
    children: Snippet<[DemoExample]>;
  } = $props();
  const translate = $derived(createDemoTranslator(locale));
</script>

<DemoPageHead title={translate('example.pageTitle', undefined, { library })} />
{#if model.currentExample === undefined}
  <div class={errorClass}>
    <p class="text-base font-medium">{translate('example.notFound', undefined, { name })}</p>
  </div>
{:else if !model.isCurrentExampleLoaded}
  <div class="min-h-[12rem]"></div>
{:else}
  <div
    {dir}
    class={model.playgroundConfiguration
      ? 'grid gap-6 py-4 lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]'
      : 'space-y-6 py-4'}
  >
    {#if !formOnly}
      <div
        class={[
          'flex flex-wrap items-center justify-between gap-4',
          wideHeading && 'lg:col-span-2',
        ]}
      >
        <div class="space-y-1">
          <h1 class={titleClass}>{model.currentExample.label}</h1>
          <SpecSourceLink spec={model.currentExample.spec} {locale} />
        </div>
      </div>
    {/if}
    {@render children(model.currentExample)}
    <PlaygroundConfiguration {model} />
  </div>
  {#if model.toastVisible}
    <div class="pointer-events-none fixed top-4 right-4 z-50">
      <div class={toastClass}>{model.toastText}</div>
    </div>
  {/if}
{/if}
