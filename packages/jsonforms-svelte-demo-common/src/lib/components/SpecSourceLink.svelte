<script lang="ts">
  import type { DemoExample } from '../examples/definitions';
  import { createDemoTranslator } from '../i18n/demo';
  const { spec, locale }: { spec: DemoExample['spec']; locale: string } = $props();
  const translate = $derived(createDemoTranslator(locale));
</script>

{#if spec}
  <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- The catalog supplies absolute upstream URLs. -->
  <a href={spec.source} target="_blank" rel="noreferrer">{translate('spec.source')}</a>
  {#if spec.hostRequirements.length > 0}
    <details data-host-requirements>
      <summary>{translate('spec.hostRequirements', 'Host requirements')}</summary>
      <ul>
        {#each spec.hostRequirements as requirement}
          <li>{requirement}</li>
        {/each}
      </ul>
    </details>
  {/if}
{/if}

<style>
  a {
    display: inline-block;
    font-size: 0.875rem;
    text-decoration: underline;
    text-underline-offset: 0.2em;
  }
  details {
    margin-block: 0.25rem 0.5rem;
    font-size: 0.875rem;
  }
  summary {
    width: fit-content;
    cursor: pointer;
  }
  ul {
    margin-block: 0.25rem 0;
    padding-inline-start: 1.25rem;
    list-style: disc;
  }
</style>
