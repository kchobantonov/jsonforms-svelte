<script lang="ts">
  import {
    RowDetailPanel,
    type RowDetailFrameProps,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import SplitPane from './SplitPane.svelte';
  import Pane from './Pane.svelte';
  const props: RowDetailFrameProps = $props();
</script>

<RowDetailPanel {...props} {SplitPane} {Pane} />
