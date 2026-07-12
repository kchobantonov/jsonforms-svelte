<script lang="ts">
  import type { ControlProps } from '@chobantonov/jsonforms-svelte';
  import DateTimeControlRenderer from '../controls/DateTimeControlRenderer.svelte';
  import ControlCell from './ControlCell.svelte';
  const props: ControlProps = $props();
</script>

<ControlCell {...props} renderer={DateTimeControlRenderer} />
