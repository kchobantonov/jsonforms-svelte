<script lang="ts">
  import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
  import { useJsonForms } from "@chobantonov/jsonforms-svelte";

  let { schema, uischema }: { schema: JsonSchema; uischema: UISchemaElement } = $props();
  const jsonforms = useJsonForms();
</script>

<pre data-testid="schema-json">{JSON.stringify(schema)}</pre>
<pre data-testid="uischema-json">{JSON.stringify(uischema)}</pre>
<pre data-testid="uischemas-count">{String(jsonforms.uischemas?.length ?? 0)}</pre>
<pre data-testid="first-uischema-tester-type">
  {typeof jsonforms.uischemas?.[0]?.tester}
</pre>
