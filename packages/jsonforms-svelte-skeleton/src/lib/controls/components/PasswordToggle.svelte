<script lang="ts">
  import TooltipContent from '../../components/TooltipContent.svelte';
  import { Tooltip } from '@skeletonlabs/skeleton-svelte';
  import { EyeIcon, EyeOffIcon } from '@lucide/svelte';
  import { getPortalRootNodeGetter, getPortalTargetResolver } from '../../util';
  let {
    label,
    revealed,
    disabled,
    onclick,
    class: className = '',
    style,
  }: {
    label: string;
    revealed: boolean;
    disabled: boolean;
    onclick: () => void;
    class?: string;
    style?: string;
  } = $props();
  const toggle = () => {
    if (!disabled) onclick();
  };
  const getRootNode = getPortalRootNodeGetter();
  const resolvePortalTarget = getPortalTargetResolver();
</script>

<Tooltip {getRootNode} positioning={{ placement: 'top', strategy: 'fixed' }}>
  <Tooltip.Trigger
    type="button"
    {disabled}
    onclick={toggle}
    aria-label={label}
    aria-pressed={revealed}
    class={`btn-icon ${className}`}
    {style}
  >
    {#if revealed}<EyeIcon class="h-5 w-5" />{:else}<EyeOffIcon class="h-5 w-5" />{/if}
  </Tooltip.Trigger>
  <TooltipContent target={resolvePortalTarget() ?? undefined}>{label}</TooltipContent>
</Tooltip>
