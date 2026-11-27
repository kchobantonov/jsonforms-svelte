<script lang="ts">
  import type { JsonSchema, UISchemaElement, JsonFormsSubStates } from '@jsonforms/core';
  const {
    schema,
    uischema,
    jsonforms,
  }: { schema: JsonSchema; uischema: UISchemaElement; jsonforms: JsonFormsSubStates } = $props();
</script>

<pre data-testid="schema-json">{JSON.stringify(schema)}</pre>
<pre data-testid="uischema-json">{JSON.stringify(uischema)}</pre>
<pre data-testid="readonly-flag">{String(jsonforms.readonly)}</pre>
<pre data-testid="renderers-count">{String(jsonforms.renderers?.length ?? 0)}</pre>
<pre data-testid="cells-count">{String(jsonforms.cells?.length ?? 0)}</pre>
<pre data-testid="uischemas-count">{String(jsonforms.uischemas?.length ?? 0)}</pre>
