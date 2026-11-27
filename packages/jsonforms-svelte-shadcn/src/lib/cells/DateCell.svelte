<script lang="ts">
  import type { ControlProps } from '@chobantonov/jsonforms-svelte-renderer-common';
  import DateControlRenderer from '../controls/DateControlRenderer.svelte';
  import ControlCell from './ControlCell.svelte';
  const props: ControlProps = $props();
</script>

<ControlCell {...props} renderer={DateControlRenderer} />
