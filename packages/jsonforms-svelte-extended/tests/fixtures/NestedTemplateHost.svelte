<script lang="ts">
  import {
    DispatchRenderer,
    useJsonFormsControl,
    type ControlProps,
  } from '@chobantonov/jsonforms-svelte';

  const props: ControlProps = $props();
  const binding = useJsonFormsControl(props);
</script>

{#if binding.control.data !== undefined}
  <DispatchRenderer
    schema={binding.control.schema}
    uischema={props.uischema.options?.template}
    path={binding.control.path}
  />
{/if}
