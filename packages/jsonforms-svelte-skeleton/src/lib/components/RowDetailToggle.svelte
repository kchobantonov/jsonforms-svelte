<script lang="ts">
  import { Tooltip, Portal } from '@skeletonlabs/skeleton-svelte';
  import { EyeIcon, EyeOffIcon } from '@lucide/svelte';
  import { onMount } from 'svelte';
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
  let focused = $state(false);
  let hovered = $state(false);
  let dismissed = $state(false);
  const tooltipOpen = $derived((focused || hovered) && !dismissed);
  onMount(() => {
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && focused) dismissed = true;
    };
    window.addEventListener('keydown', dismissOnEscape, true);
    return () => window.removeEventListener('keydown', dismissOnEscape, true);
  });
</script>

<Tooltip
  open={tooltipOpen}
  openDelay={0}
  {getRootNode}
  positioning={{ placement: 'top', strategy: 'fixed' }}
>
  <Tooltip.Trigger
    type="button"
    {disabled}
    onclick={toggle}
    aria-label={label}
    aria-expanded={open}
    class={`btn-icon ${className}`}
    {style}
    onpointerenter={() => {
      hovered = true;
      dismissed = false;
    }}
    onpointerleave={() => (hovered = false)}
    onfocus={() => {
      focused = true;
      dismissed = false;
    }}
    onblur={() => (focused = false)}
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
