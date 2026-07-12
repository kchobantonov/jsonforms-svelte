<script lang="ts">
  import type { ControlProps } from '@chobantonov/jsonforms-svelte';
  import OneOfEnumControlRenderer from '../controls/OneOfEnumControlRenderer.svelte';
  import ControlCell from './ControlCell.svelte';
  const props: ControlProps = $props();
</script>

<ControlCell {...props} renderer={OneOfEnumControlRenderer} />
