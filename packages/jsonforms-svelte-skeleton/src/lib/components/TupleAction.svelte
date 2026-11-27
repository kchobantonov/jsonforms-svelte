<script lang="ts">
  import TooltipContent from './TooltipContent.svelte';
  import {
    TupleActionIcon,
    tupleActionAttributes,
    type TupleActionProps,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import type { Snippet } from 'svelte';
  import { Tooltip } from '@skeletonlabs/skeleton-svelte';
  import { PlusIcon, Trash2Icon } from '@lucide/svelte';
  import { useTooltipTrigger } from '../util/tooltipTrigger.svelte';
  import { getPortalRootNodeGetter, getPortalTargetResolver } from '../util';
  let {
    label,
    ariaLabel,
    buttonClass,
    dataDeleteSelected = false,
    icon,
    disabled = false,
    kind = 'add',
    onmousedown,
    onclick,
  }: Omit<TupleActionProps, 'onclick'> & {
    ariaLabel?: string;
    buttonClass?: string;
    dataDeleteSelected?: boolean;
    icon?: Snippet;
    onmousedown?: (event: MouseEvent) => void;
    onclick: (event: MouseEvent) => void;
  } = $props();
  const iconOnly = $derived(kind === 'add' || kind === 'delete');
  const getRootNode = getPortalRootNodeGetter();
  const resolvePortalTarget = getPortalTargetResolver();
  const tooltip = useTooltipTrigger(80);
</script>

{#if iconOnly}
  <Tooltip
    open={tooltip.open}
    openDelay={0}
    {getRootNode}
    positioning={{ placement: 'top', strategy: 'fixed' }}
  >
    <Tooltip.Trigger
      {...tooltip.events}
      type="button"
      class={buttonClass ??
        `btn-icon btn-icon-sm ${kind === 'delete' ? 'preset-filled-error-500' : 'preset-tonal'}`}
      {disabled}
      {onmousedown}
      {onclick}
      {...tupleActionAttributes(label, ariaLabel, dataDeleteSelected)}
    >
      <TupleActionIcon {icon} {kind} Add={PlusIcon} Delete={Trash2Icon} />
    </Tooltip.Trigger>
    <TooltipContent target={resolvePortalTarget() ?? undefined}>{label}</TooltipContent>
  </Tooltip>
{:else}
  <button
    type="button"
    class={'btn btn-sm ' + (kind === 'remove' ? 'preset-filled-error-500' : 'preset-tonal')}
    {disabled}
    {onclick}
    aria-label={label}
    title={label}>{label}</button
  >
{/if}
