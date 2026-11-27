<script lang="ts">
  import { JsonForms } from '@chobantonov/jsonforms-svelte-extended';
  import type { useExamplePage } from '../core/examplePage.svelte';
  const { model }: { model: ReturnType<typeof useExamplePage> } = $props();
  const configuration = $derived(model.playgroundConfiguration);
  const form = $derived(model.jsonFormsPropsForRender);
</script>

{#if configuration && form}
  <section class="rounded-lg border p-6" data-testid="dynamic-playground-configuration">
    <h2 class="mb-4 text-lg font-semibold">
      {model.previewProps.translate('dynamic.configuration')}
    </h2>
    <JsonForms
      schema={configuration.schema}
      uischema={configuration.uischema}
      data={model.playgroundSettings}
      renderers={form.renderers}
      cells={form.cells}
      i18n={form.i18n}
      onchange={(event) => {
        if (JSON.stringify(event.data) === JSON.stringify(model.playgroundExternal.settings))
          return;
        model.playgroundExternal = { ...model.playgroundExternal, settings: event.data };
        model.externalModel = JSON.stringify(model.playgroundExternal, null, 2);
      }}
    />
  </section>
{/if}
