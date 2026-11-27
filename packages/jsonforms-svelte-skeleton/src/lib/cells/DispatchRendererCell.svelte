<script lang="ts">
  import { RendererCell, type ControlProps } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { ControlWrapperSymbol } from '../util';
  import CellContent from './CellContent.svelte';
  const props: ControlProps = $props();
</script>

<RendererCell {...props} wrapperKey={ControlWrapperSymbol} content={CellContent} />
