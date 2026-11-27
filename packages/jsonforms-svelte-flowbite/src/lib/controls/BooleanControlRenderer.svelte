<script lang="ts">
  import type { ControlProps } from '@chobantonov/jsonforms-svelte-renderer-common';
  import BooleanInput from './components/BooleanInput.svelte';
  const props: ControlProps = $props();
</script>

<BooleanInput {...props} />
