<script lang="ts">
  import ContainerValidationIndicator from './ContainerValidationIndicator.svelte';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import { Input } from '@jsonforms-svelte-shadcn-ui/input';
  import { PencilIcon, Trash2Icon, CheckIcon, XIcon } from '$lib/components/icons';
  import {
    RecursiveNodeContent,
    type RecursiveTreeNode,
    type RecursiveTreeViewProps,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  let { node, model }: { node: RecursiveTreeNode; model: RecursiveTreeViewProps } = $props();
  const icons = { rename: PencilIcon, remove: Trash2Icon, accept: CheckIcon, cancel: XIcon };
</script>

<RecursiveNodeContent {node} {model} Validation={ContainerValidationIndicator} {Input}>
  {#snippet button(kind, label, onclick)}
    {@const Icon = icons[kind]}
    <Button type="button" variant="ghost" size="icon" aria-label={label} {onclick}
      ><Icon class="size-4" /></Button
    >
  {/snippet}
</RecursiveNodeContent>
