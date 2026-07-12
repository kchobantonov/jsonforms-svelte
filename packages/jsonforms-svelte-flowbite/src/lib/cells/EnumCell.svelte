<script lang="ts">
  import type { ControlProps } from '@chobantonov/jsonforms-svelte';
  import EnumControlRenderer from '../controls/EnumControlRenderer.svelte';
  import ControlCell from './ControlCell.svelte';
  const props: ControlProps = $props();
</script>

<ControlCell {...props} renderer={EnumControlRenderer} />
