<script lang="ts">
  import type { useExamplePage } from '../core/examplePage.svelte';
  import type { createDemoTranslator } from '../i18n/demo';
  const {
    model,
    translateDemo,
    class: className,
  }: {
    model: ReturnType<typeof useExamplePage>;
    translateDemo: ReturnType<typeof createDemoTranslator>;
    class: string;
  } = $props();
  const { schemaErrorCount, additionalErrorCount, validityPending } = $derived(model);
</script>

{#if schemaErrorCount > 0 || additionalErrorCount > 0}
  <span class={className} data-testid="form-validation-breakdown">
    {#if schemaErrorCount > 0}{translateDemo('validation.schemaCount', undefined, {
        count: schemaErrorCount,
      })}{/if}
    {#if schemaErrorCount > 0 && additionalErrorCount > 0}
      ·
    {/if}
    {#if additionalErrorCount > 0}{translateDemo('validation.additionalCount', undefined, {
        count: additionalErrorCount,
      })}{/if}
  </span>
{/if}
{#if validityPending}
  <span class={className} data-testid="form-validation-pending" role="status"
    >{translateDemo('validation.pending')}</span
  >
{/if}
