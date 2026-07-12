<script lang="ts">
  import type { ControlProps } from '@chobantonov/jsonforms-svelte';
  import StringControlRenderer from '../controls/StringControlRenderer.svelte';
  import ControlCell from './ControlCell.svelte';
  const props: ControlProps = $props();
</script>

<ControlCell {...props} renderer={StringControlRenderer} />
