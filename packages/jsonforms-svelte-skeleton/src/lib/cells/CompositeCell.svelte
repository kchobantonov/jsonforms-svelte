<script lang="ts">
  import XIcon from '@lucide/svelte/icons/x';
  import TooltipContent from '../components/TooltipContent.svelte';
  import {
    useCompositeCell,
    CompositeCellContent,
    type ControlProps,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import ConfirmationDialog from '../complex/components/ConfirmationDialog.svelte';
  import { Tooltip } from '@skeletonlabs/skeleton-svelte';
  import { onMount } from 'svelte';
  import { getIsDynamicProperty, getPortalRootNodeGetter, getPortalTargetResolver } from '../util';
  import DetailDialog from '../components/DetailDialog.svelte';
  import CellContent from './CellContent.svelte';
  const props: ControlProps = $props();
  const cell = useCompositeCell(props, getIsDynamicProperty(false));
  const { clearActions, message } = cell;
  const getRootNode = getPortalRootNodeGetter();
  const resolvePortalTarget = getPortalTargetResolver();
  let removeFocused = $state(false);
  let removeHovered = $state(false);
  let removeDismissed = $state(false);
  const removeTooltipOpen = $derived((removeFocused || removeHovered) && !removeDismissed);
  const dismissRemoveTooltip = (event: KeyboardEvent) => {
    if (event.key === 'Escape') removeDismissed = true;
  };
  onMount(() => () => window.removeEventListener('keydown', dismissRemoveTooltip, true));
  const label = $derived(cell.label);
</script>

<CompositeCellContent {cell} {CellContent} {DetailDialog} {ConfirmationDialog} styleClearButton>
  {#snippet removeButton()}
    <Tooltip
      open={removeTooltipOpen}
      openDelay={0}
      {getRootNode}
      positioning={{ placement: 'top', strategy: 'fixed' }}
    >
      <Tooltip.Trigger>
        {#snippet element(triggerProps)}
          <button
            {...triggerProps}
            type="button"
            class="composite-clear"
            disabled={!clearActions.canRemove}
            aria-label={message('composite.removeLabel', { label })}
            title={message('composite.remove')}
            onclick={() => clearActions.remove()}
            onfocus={() => {
              removeFocused = true;
              removeDismissed = false;
              window.addEventListener('keydown', dismissRemoveTooltip, true);
            }}
            onblur={() => {
              removeFocused = false;
              window.removeEventListener('keydown', dismissRemoveTooltip, true);
            }}
            onpointerenter={() => {
              removeHovered = true;
              removeDismissed = false;
            }}
            onpointerleave={() => (removeHovered = false)}
          >
            <XIcon size={16} aria-hidden="true" />
          </button>
        {/snippet}
      </Tooltip.Trigger>
      <TooltipContent target={resolvePortalTarget() ?? undefined}
        >{message('composite.remove')}</TooltipContent
      >
    </Tooltip>
  {/snippet}
</CompositeCellContent>
