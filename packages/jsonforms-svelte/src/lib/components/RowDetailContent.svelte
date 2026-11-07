<script lang="ts">
  import { Generate, type ControlElement, type JsonSchema } from '@jsonforms/core';
  import { useJsonForms } from '../jsonFormsCompositions.svelte';
  import { findDetailUISchema } from '../detail';
  import CollectionItem from './CollectionItem.svelte';
  import DispatchRenderer from './DispatchRenderer.svelte';
  let {
    schema,
    identity,
    sourceItem,
    path,
    scope,
    detail,
    enabled,
  }: {
    schema: JsonSchema;
    identity?: string;
    sourceItem?: unknown;
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

{#snippet content()}
  <DispatchRenderer
    {schema}
    {uischema}
    {path}
    {enabled}
    renderers={form.renderers}
    cells={form.cells}
  />
{/snippet}

{#key identity}
  {#if identity !== undefined}
    <CollectionItem {identity} {path} {sourceItem} children={content} />
  {:else}
    {@render content()}
  {/if}
{/key}
