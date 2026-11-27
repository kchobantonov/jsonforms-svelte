<script lang="ts">
  import ContainerValidationIndicator from './ContainerValidationIndicator.svelte';
  import { Button, Input } from 'flowbite-svelte';
  import {
    PenOutline as PencilIcon,
    TrashBinOutline as Trash2Icon,
    CheckOutline as CheckIcon,
    CloseOutline as XIcon,
  } from 'flowbite-svelte-icons';
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
    <Button type="button" color="alternative" size="xs" aria-label={label} {onclick}
      ><Icon class="size-4" /></Button
    >
  {/snippet}
</RecursiveNodeContent>
