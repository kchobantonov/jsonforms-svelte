<script lang="ts">
  import { TooltipContent } from '@chobantonov/jsonforms-svelte-skeleton';
  import { GridCellContent } from '@chobantonov/jsonforms-svelte-extended';
  import {
    DetailDialog,
    ValidationIcon,
    getPortalRootNodeGetter,
    getPortalTargetResolver,
  } from '@chobantonov/jsonforms-svelte-skeleton';
  import { Tooltip } from '@skeletonlabs/skeleton-svelte';
  import { PencilIcon } from '@lucide/svelte';
  import { untrack, onMount } from 'svelte';
  import type { AgGridCellHostProps } from '../types.js';

  let { initialProps }: { initialProps: AgGridCellHostProps } = $props();
  const getRootNode = getPortalRootNodeGetter();
  const resolvePortalTarget = getPortalTargetResolver();
  let selectFocused = $state(false);
  let selectHovered = $state(false);
  let selectDismissed = $state(false);
  const selectTooltipOpen = $derived((selectFocused || selectHovered) && !selectDismissed);
  const dismissSelectTooltip = (event: KeyboardEvent) => {
    if (event.key === 'Escape') selectDismissed = true;
  };
  onMount(() => () => window.removeEventListener('keydown', dismissSelectTooltip, true));
  let current = $state.raw(untrack(() => initialProps));

  export function refresh(next: AgGridCellHostProps) {
    current = next;
  }
</script>

<GridCellContent {current} {DetailDialog} {ValidationIcon}>
  {#snippet selectButton(attributes)}
    <Tooltip
      open={selectTooltipOpen}
      openDelay={0}
      {getRootNode}
      positioning={{ placement: 'top', strategy: 'fixed' }}
    >
      <Tooltip.Trigger>
        {#snippet element(triggerProps)}
          <button
            {...triggerProps}
            type="button"
            class="btn-icon btn-icon-sm preset-tonal"
            {...attributes}
            onfocus={() => {
              selectFocused = true;
              selectDismissed = false;
              window.addEventListener('keydown', dismissSelectTooltip, true);
            }}
            onblur={() => {
              selectFocused = false;
              window.removeEventListener('keydown', dismissSelectTooltip, true);
            }}
            onpointerenter={() => {
              selectHovered = true;
              selectDismissed = false;
            }}
            onpointerleave={() => (selectHovered = false)}
            ><PencilIcon class="size-4" />
          </button>
        {/snippet}
      </Tooltip.Trigger>
      <TooltipContent target={resolvePortalTarget() ?? undefined}>{attributes.title}</TooltipContent
      >
    </Tooltip>
  {/snippet}
</GridCellContent>
