<script lang="ts">
  import type { DemoExample } from '../examples/definitions';
  import { createDemoTranslator } from '../i18n/demo';
  const { spec, locale }: { spec: DemoExample['spec']; locale: string } = $props();
  const translate = $derived(createDemoTranslator(locale));
</script>

{#if spec}
  <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- The catalog supplies absolute upstream URLs. -->
  <a href={spec.source} target="_blank" rel="noreferrer">{translate('spec.source')}</a>
{/if}

<style>
  a {
    display: inline-block;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    text-decoration: underline;
    text-underline-offset: 0.2em;
  }
</style>
