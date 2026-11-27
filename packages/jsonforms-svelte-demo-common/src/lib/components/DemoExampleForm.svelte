<script lang="ts">
  import type { Snippet } from 'svelte';
  import { JsonForms, type JsonFormsProps } from '@chobantonov/jsonforms-svelte-extended';
  import type { useExamplePage } from '../core/examplePage.svelte';
  import type { DemoExample } from '../examples/definitions';
  const {
    model,
    class: className,
    webForm,
  }: {
    model: ReturnType<typeof useExamplePage>;
    class: string;
    webForm: Snippet<[JsonFormsProps, DemoExample]>;
  } = $props();
</script>

{#if model.jsonFormsPropsForRender && model.currentExample}
  {#if model.shouldUseWebComponentView}
    {@render webForm(model.jsonFormsPropsForRender, model.currentExample)}
  {:else}
    <div class={className} data-mode={model.formModeOverride}>
      <JsonForms {...model.nativeFormProps(model.jsonFormsPropsForRender)} />
    </div>
  {/if}
{/if}
