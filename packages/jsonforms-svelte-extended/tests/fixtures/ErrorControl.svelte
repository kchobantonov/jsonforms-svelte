<script lang="ts">
  import { useJsonFormsControl, type ControlProps } from '@chobantonov/jsonforms-svelte';
  const props: ControlProps = $props();
  const binding = useJsonFormsControl(props);
</script>

<output data-testid="translated-error">{binding.control.errors}</output>
