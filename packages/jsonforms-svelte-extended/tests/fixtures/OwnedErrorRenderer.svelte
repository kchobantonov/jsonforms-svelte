<script lang="ts">
  import { getContext, onMount } from 'svelte';
  import type { UISchemaElement } from '@jsonforms/core';
  import { useOwnedErrors, useJsonForms } from '@chobantonov/jsonforms-svelte';
  import { FormContextSymbol, type FormContext } from '../../src/lib/core/types';
  let { uischema }: { uischema: UISchemaElement } = $props();
  const store = useOwnedErrors();
  const jsonforms = useJsonForms();
  const context = getContext<FormContext>(FormContextSymbol);
  onMount(() => uischema.options?.capture?.({ store, context, jsonforms }));
</script>

<pre>{JSON.stringify(context.additionalErrors)}</pre>
