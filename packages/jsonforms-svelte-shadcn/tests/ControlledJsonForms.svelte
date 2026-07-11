<script lang="ts">
  import {
    JsonForms,
    type JsonFormsChangeEvent,
    type JsonFormsProps,
  } from '@chobantonov/jsonforms-svelte';
  import { untrack } from 'svelte';

  let { data, onchange, ...props }: JsonFormsProps = $props();
  let currentData = $state(untrack(() => data));

  function handleChange(event: JsonFormsChangeEvent) {
    currentData = event.data;
    onchange?.(event);
  }
</script>

<JsonForms {...props} data={currentData} onchange={handleChange} />
