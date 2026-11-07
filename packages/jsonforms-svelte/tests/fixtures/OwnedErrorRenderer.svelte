<script lang="ts">
  import { getContext, onMount } from 'svelte';
  import type { CoreActions, JsonFormsSubStates, UISchemaElement } from '@jsonforms/core';
  import { useOwnedErrors } from '../../src/lib/ownedErrors.svelte';
  import { DispatchContextSymbol, JsonFormsContextSymbol } from '../../src/lib/types';
  let { uischema }: { uischema: UISchemaElement } = $props();
  const store = useOwnedErrors();
  const dispatch = getContext<(action: CoreActions) => void>(DispatchContextSymbol);
  const jsonforms = getContext<JsonFormsSubStates>(JsonFormsContextSymbol);
  onMount(() => uischema.options?.capture?.({ store, dispatch, jsonforms }));
</script>

<pre data-testid="owned-errors">{JSON.stringify(jsonforms.core?.additionalErrors)}</pre>
