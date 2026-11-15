<script lang="ts">
  import {
    useJsonFormsControl,
    type ControlProps,
  } from '../../src/lib/jsonFormsCompositions.svelte';
  const props: ControlProps = $props();
  const binding = useJsonFormsControl(props);
</script>

<input
  aria-label={binding.control.label}
  aria-invalid={Boolean(binding.control.errors)}
  required={binding.control.required}
  disabled={!binding.control.enabled}
  value={String(binding.control.data ?? '')}
  oninput={(event) => binding.handleChange(binding.control.path, event.currentTarget.value)}
/>
<output>{binding.control.errors}</output>

<button onclick={() => binding.handleChange(binding.control.path, undefined)}>Clear</button>
