<script lang="ts">
  import type { ControlProps } from '@chobantonov/jsonforms-svelte-renderer-common';
  import NumberControlRenderer from '../controls/NumberControlRenderer.svelte';
  import ControlCell from './ControlCell.svelte';
  const props: ControlProps = $props();
</script>

<ControlCell {...props} renderer={NumberControlRenderer} />
