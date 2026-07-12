<script lang="ts">
  import type { ControlProps } from '@chobantonov/jsonforms-svelte';
  import TimeControlRenderer from '../controls/TimeControlRenderer.svelte';
  import ControlCell from './ControlCell.svelte';
  const props: ControlProps = $props();
</script>

<ControlCell {...props} renderer={TimeControlRenderer} />
