<script lang="ts">
  import { Generate, type ControlElement, type JsonSchema } from '@jsonforms/core';
  import { useJsonForms } from '../jsonFormsCompositions.svelte';
  import { findDetailUISchema } from '../detail';
  import DispatchRenderer from './DispatchRenderer.svelte';
  let {
    schema,
    path,
    scope,
    detail,
    enabled,
  }: {
    schema: JsonSchema;
    path: string;
    scope: string;
    detail: unknown;
    enabled: boolean;
  } = $props();
  const form = useJsonForms();
  const uischema = $derived(
    findDetailUISchema(
      form.uischemas ?? [],
      schema,
      scope,
      path,
      () => Generate.uiSchema(schema, 'VerticalLayout', undefined, form.core?.schema),
      { type: 'Control', scope, options: { detail } } as ControlElement,
      form.core?.schema,
    ),
  );
</script>

<DispatchRenderer
  {schema}
  {uischema}
  {path}
  {enabled}
  renderers={form.renderers}
  cells={form.cells}
/>
