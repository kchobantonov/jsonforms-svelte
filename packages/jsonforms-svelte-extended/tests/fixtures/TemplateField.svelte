<script lang="ts">
  import {
    useJsonFormsControl,
    type ControlProps,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { useDispatch } from '@chobantonov/jsonforms-svelte';
  import { update } from '@jsonforms/core';
  const props: ControlProps = $props();
  const binding = useJsonFormsControl(props);
  const dispatch = useDispatch();
</script>

<input
  aria-label="Name"
  value={binding.control.data ?? ''}
  disabled={!binding.control.enabled}
  oninput={(event) => dispatch(update(binding.control.path, () => event.currentTarget.value))}
/>
