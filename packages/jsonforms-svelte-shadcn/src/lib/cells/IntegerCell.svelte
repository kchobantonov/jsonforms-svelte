<script lang="ts">
  import type { ControlProps } from '@chobantonov/jsonforms-svelte-renderer-common';
  import IntegerControlRenderer from '../controls/IntegerControlRenderer.svelte';
  import ControlCell from './ControlCell.svelte';
  const props: ControlProps = $props();
</script>

<ControlCell {...props} renderer={IntegerControlRenderer} />
