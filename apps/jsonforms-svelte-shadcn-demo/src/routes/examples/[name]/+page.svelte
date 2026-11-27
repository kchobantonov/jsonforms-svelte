<script lang="ts">
  import ExamplePage from '$shadcnDemo/ExamplePage.svelte';
  import JsonFormsWebComponentWrapper from '$lib/components/JsonFormsWebComponentWrapper.svelte';
  import { shadcnRenderers, shadcnCells } from '@chobantonov/jsonforms-svelte-shadcn';
  import {
    shadcnExtendedRenderers,
    shadcnExtendedCells,
  } from '@chobantonov/jsonforms-svelte-shadcn-extended';

  const renderers = [...shadcnRenderers, ...shadcnExtendedRenderers];
  const cells = [...shadcnCells, ...shadcnExtendedCells];
</script>

<ExamplePage {JsonFormsWebComponentWrapper} {renderers} {cells} externalPlayground />
