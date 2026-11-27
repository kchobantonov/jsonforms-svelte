<script lang="ts">
  import {
    type ControlProps,
    RecursiveTreeRenderer as BaseRecursiveTreeRenderer,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import Tree from './components/RecursiveTreeView.svelte';
  import Link from './components/RecursiveNodeLink.svelte';
  import ConfirmationDialog from './components/ConfirmationDialog.svelte';
  const props: ControlProps = $props();
</script>

<BaseRecursiveTreeRenderer {...props} {Tree} {Link} {ConfirmationDialog} />
