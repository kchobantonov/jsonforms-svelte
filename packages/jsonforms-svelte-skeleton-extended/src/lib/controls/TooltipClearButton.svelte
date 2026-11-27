<script lang="ts">
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import { Tooltip } from '@skeletonlabs/skeleton-svelte';
  import { XIcon } from '@lucide/svelte';
  import {
    TooltipContent,
    getPortalRootNodeGetter,
    getPortalTargetResolver,
    useTooltipTrigger,
  } from '@chobantonov/jsonforms-svelte-skeleton';
  const {
    label,
    hideIcon,
    ...attributes
  }: HTMLButtonAttributes & { label: string; hideIcon?: boolean } = $props();
  const tooltip = useTooltipTrigger();
  const getRootNode = getPortalRootNodeGetter();
  const resolveTarget = getPortalTargetResolver();
</script>

<Tooltip
  open={tooltip.open}
  openDelay={0}
  {getRootNode}
  positioning={{ placement: 'top', strategy: 'fixed' }}
>
  <Tooltip.Trigger>
    {#snippet element(triggerProps)}
      <button {...triggerProps} type="button" {...attributes} aria-label={label} {...tooltip.events}
        ><XIcon class="size-4" aria-hidden={hideIcon || undefined} /></button
      >
    {/snippet}
  </Tooltip.Trigger>
  <TooltipContent target={resolveTarget() ?? undefined}>{label}</TooltipContent>
</Tooltip>
