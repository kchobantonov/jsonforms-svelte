<script lang="ts">
  import TooltipContent from '../components/TooltipContent.svelte';
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte-renderer-common';
  const message = useRendererMessages();
  import { CircleAlertIcon } from '@lucide/svelte';
  import { Tooltip } from '@skeletonlabs/skeleton-svelte';
  import { useTooltipTrigger } from '../util/tooltipTrigger.svelte';
  import { getPortalRootNodeGetter, getPortalTargetResolver } from '../util';
  import type { Snippet } from 'svelte';
  let { errors, children }: { errors?: string; children: Snippet } = $props();
  const invalid = $derived(!!errors?.trim());
  const getRootNode = getPortalRootNodeGetter();
  const resolvePortalTarget = getPortalTargetResolver();
  const tooltip = useTooltipTrigger(80);
</script>

<div
  class:cell-invalid={invalid}
  class="[&.cell-invalid_input]:!border-error-500 [&.cell-invalid_select]:!border-error-500 [&.cell-invalid_button]:!border-error-500 flex min-w-0 items-center gap-1.5"
>
  <div class="min-w-0 flex-1">{@render children()}</div>
  {#if invalid}<Tooltip
      open={tooltip.open}
      openDelay={0}
      {getRootNode}
      positioning={{ placement: 'top', strategy: 'fixed' }}
    >
      <Tooltip.Trigger
        {...tooltip.events}
        type="button"
        class="btn-icon btn-icon-sm text-error-500 shrink-0"
        title={errors}
        aria-label={message('validation.cellErrors', { errors })}
        ><CircleAlertIcon class="size-4" /></Tooltip.Trigger
      >
      <TooltipContent
        target={resolvePortalTarget() ?? undefined}
        positionerClass="pointer-events-none"
        class="card preset-filled-surface-950-50 pointer-events-none px-3 py-2 text-sm whitespace-pre-line shadow-xl"
        >{errors}</TooltipContent
      >
    </Tooltip>{/if}
</div>
