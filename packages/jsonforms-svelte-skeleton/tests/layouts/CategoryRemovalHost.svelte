<script lang="ts">
  import { untrack } from 'svelte';
  import { JsonForms, type JsonFormsChangeEvent } from '@chobantonov/jsonforms-svelte';
  import type {
    JsonFormsRendererRegistryEntry,
    JsonSchema,
    UISchemaElement,
  } from '@jsonforms/core';

  let {
    schema,
    uischema,
    renderers,
    data,
    onchange,
    removeFirst = false,
  }: {
    schema: JsonSchema;
    uischema: UISchemaElement;
    renderers: JsonFormsRendererRegistryEntry[];
    data: unknown;
    onchange: (event: JsonFormsChangeEvent) => void;
    removeFirst?: boolean;
  } = $props();

  const initial = untrack(() => uischema);
  let current = $state(initial);
</script>

<button
  type="button"
  onclick={() => {
    const elements = (current as UISchemaElement & { elements?: UISchemaElement[] }).elements ?? [];
    current = { ...current, elements: removeFirst ? elements.slice(1) : [] };
  }}
>
  {removeFirst ? 'Remove first category' : 'Remove final category'}
</button>
<button type="button" onclick={() => (current = initial)}>Restore category</button>
<JsonForms {schema} uischema={current} {renderers} {data} {onchange} />
