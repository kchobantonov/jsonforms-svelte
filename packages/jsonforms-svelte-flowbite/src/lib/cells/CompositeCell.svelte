<script lang="ts">
  import {
    useCompositeCell,
    CompositeCellContent,
    type ControlProps,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import ConfirmationDialog from '../complex/components/ConfirmationDialog.svelte';
  import { Button, Tooltip } from 'flowbite-svelte';
  import { CloseOutline } from 'flowbite-svelte-icons';
  import { getIsDynamicProperty } from '../util';
  import DetailDialog from '../components/DetailDialog.svelte';
  import CellContent from './CellContent.svelte';
  const props: ControlProps = $props();
  const cell = useCompositeCell(props, getIsDynamicProperty(false));
  const { clearActions, message } = cell;
  const label = $derived(cell.label);
</script>

<CompositeCellContent {cell} {CellContent} {DetailDialog} {ConfirmationDialog}>
  {#snippet removeButton()}
    <Button
      type="button"
      size="xs"
      color="alternative"
      class="composite-clear"
      disabled={!clearActions.canRemove}
      aria-label={message('composite.removeLabel', { label })}
      title={message('composite.remove')}
      onclick={() => clearActions.remove()}
    >
      <CloseOutline class="h-4 w-4" aria-hidden="true" />
    </Button>
    <Tooltip>{message('composite.remove')}</Tooltip>
  {/snippet}
</CompositeCellContent>
