<script lang="ts">
  import { useJsonFormsControl } from '../../src/lib/core/jsonFormsCompositions.svelte';
  import type { ControlProps } from '../../src/lib/index';
  const props: ControlProps = $props();
  const binding = useJsonFormsControl(props);
</script>

<button onclick={() => binding.handleChange(binding.control.path, 'changed')}
  >Write through dispatch</button
>
<output data-testid="control-value">{binding.control.data}</output>
