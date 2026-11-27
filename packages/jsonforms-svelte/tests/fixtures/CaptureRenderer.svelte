<script lang="ts">
  import CapturedFormState from './CapturedFormState.svelte';
  import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
  import { useJsonForms } from '../../src/lib/jsonFormsCompositions.svelte';

  let { schema, uischema }: { schema: JsonSchema; uischema: UISchemaElement } = $props();
  const jsonforms = useJsonForms();
</script>

<CapturedFormState {schema} {uischema} {jsonforms} />
