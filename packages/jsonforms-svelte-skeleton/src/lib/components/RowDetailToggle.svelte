<script lang="ts">
  import { Tooltip, Portal } from '@skeletonlabs/skeleton-svelte';
  import { EyeIcon, EyeOffIcon } from '@lucide/svelte';
  import { getPortalRootNodeGetter, getPortalTargetResolver } from '../util';
  let {
    label,
    open,
    disabled,
    onclick,
    class: className = '',
    style,
  }: {
    label: string;
    open: boolean;
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
    aria-expanded={open}
    class={`btn-icon ${className}`}
    {style}
  >
    {#if open}<EyeIcon class="h-5 w-5" />{:else}<EyeOffIcon class="h-5 w-5" />{/if}
  </Tooltip.Trigger>
  <Portal target={resolvePortalTarget() ?? undefined}
    ><Tooltip.Context>
      {#snippet children(tooltip)}
        <div {...tooltip().getPositionerProps()}>
          <Tooltip.Content class="card preset-filled-surface-950-50 px-3 py-2 text-sm shadow-xl"
            >{label}</Tooltip.Content
          >
        </div>
      {/snippet}
    </Tooltip.Context></Portal
  >
</Tooltip>
