<script lang="ts">
  import CapturedFormState from '../../../jsonforms-svelte/tests/fixtures/CapturedFormState.svelte';
  import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
  import { useJsonForms, useAuthoredConfig } from '../../src/lib/core/jsonFormsCompositions.svelte';

  let { schema, uischema }: { schema: JsonSchema; uischema: UISchemaElement } = $props();
  const jsonforms = useJsonForms();
  const authored = useAuthoredConfig();
</script>

<CapturedFormState {schema} {uischema} {jsonforms} />

<pre data-testid="authored-config">{JSON.stringify(authored.value) ?? 'absent'}</pre>
<pre data-testid="core-restrict">{String(jsonforms.config?.restrict)}</pre>

<pre data-testid="core-schema-json">{JSON.stringify(jsonforms.core?.schema)}</pre>
