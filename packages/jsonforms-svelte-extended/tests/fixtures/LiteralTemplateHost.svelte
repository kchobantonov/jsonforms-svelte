<script lang="ts">
  import {
    DispatchRenderer,
    useJsonFormsControl,
    useDetailDialog,
    type ControlProps,
  } from '@chobantonov/jsonforms-svelte';
  import { onMount } from 'svelte';
  const props: ControlProps = $props();
  const binding = useJsonFormsControl(props);
  const editor = useDetailDialog({
    get path() {
      return binding.control.path;
    },
    get schema() {
      return binding.control.schema;
    },
    get enabled() {
      return binding.control.enabled;
    },
    label: 'Detail',
    children: body,
  });
  onMount(() =>
    props.uischema.options?.capture?.({
      editor,
    }),
  );
</script>

{#snippet body()}{/snippet}
<DispatchRenderer
  schema={binding.control.schema}
  uischema={props.uischema.options?.template}
  path={binding.control.path}
/>
