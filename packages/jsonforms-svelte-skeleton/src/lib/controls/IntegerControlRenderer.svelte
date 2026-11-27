<script lang="ts">
  import type { ControlProps } from '@chobantonov/jsonforms-svelte-renderer-common';
  import NumericControl from './NumericControl.svelte';

  const props: ControlProps = $props();
</script>

<NumericControl {...props} integer={true} />
