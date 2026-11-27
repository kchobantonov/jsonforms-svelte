<script lang="ts">
  import type { ControlProps } from '@chobantonov/jsonforms-svelte-renderer-common';
  import BooleanControlRenderer from './BooleanControlRenderer.svelte';
  const props: ControlProps = $props();
</script>

<BooleanControlRenderer {...props} toggle />
