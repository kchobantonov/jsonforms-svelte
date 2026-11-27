<script lang="ts">
  import ContainerValidationIndicator from './ContainerValidationIndicator.svelte';
  import { PencilIcon, Trash2Icon, CheckIcon, XIcon } from '@lucide/svelte';
  import {
    RecursiveNodeContent,
    type RecursiveTreeNode,
    type RecursiveTreeViewProps,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  let { node, model }: { node: RecursiveTreeNode; model: RecursiveTreeViewProps } = $props();
  const icons = { rename: PencilIcon, remove: Trash2Icon, accept: CheckIcon, cancel: XIcon };
</script>

<RecursiveNodeContent {node} {model} Validation={ContainerValidationIndicator}>
  {#snippet button(kind, label, onclick)}
    {@const Icon = icons[kind]}
    <button type="button" class="btn-icon preset-tonal size-8" aria-label={label} {onclick}
      ><Icon class="size-4" /></button
    >
  {/snippet}
</RecursiveNodeContent>
