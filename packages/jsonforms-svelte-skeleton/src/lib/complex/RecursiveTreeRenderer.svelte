<script lang="ts">
  import { RecursiveTreeRenderer, type ControlProps } from '@chobantonov/jsonforms-svelte';
  import Tree from './components/RecursiveTreeView.svelte';
  import Link from './components/RecursiveNodeLink.svelte';
  import ConfirmationDialog from './components/ConfirmationDialog.svelte';
  const props: ControlProps = $props();
</script>

<RecursiveTreeRenderer {...props} {Tree} {Link} {ConfirmationDialog} />
