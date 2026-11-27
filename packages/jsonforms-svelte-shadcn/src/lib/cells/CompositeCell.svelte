<script lang="ts">
  import XIcon from '@lucide/svelte/icons/x';
  import TooltipContent from '../components/TooltipContent.svelte';
  import {
    useCompositeCell,
    CompositeCellContent,
    type ControlProps,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import ConfirmationDialog from '../complex/components/ConfirmationDialog.svelte';
  import { mergeProps } from 'bits-ui';
  import * as Tooltip from '@jsonforms-svelte-shadcn-ui/tooltip';
  import { getIsDynamicProperty } from '../util';
  import DetailDialog from '../components/DetailDialog.svelte';
  import CellContent from './CellContent.svelte';
  const props: ControlProps = $props();
  const cell = useCompositeCell(props, getIsDynamicProperty(false));
  const { clearActions, message } = cell;
  const label = $derived(cell.label);
</script>

<CompositeCellContent {cell} {CellContent} {DetailDialog} {ConfirmationDialog} styleClearButton>
  {#snippet removeButton()}
    <Tooltip.Provider
      ><Tooltip.Root
        ><Tooltip.Trigger>
          {#snippet child({ props: triggerProps })}
            <button
              {...mergeProps(triggerProps, { onclick: () => clearActions.remove() })}
              type="button"
              class="composite-clear"
              disabled={!clearActions.canRemove}
              aria-label={message('composite.removeLabel', { label })}
              title={message('composite.remove')}
            >
              <XIcon size={16} aria-hidden="true" />
            </button>
          {/snippet}
        </Tooltip.Trigger><TooltipContent>{message('composite.remove')}</TooltipContent
        ></Tooltip.Root
      ></Tooltip.Provider
    >
  {/snippet}
</CompositeCellContent>
