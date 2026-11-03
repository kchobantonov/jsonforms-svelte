<script lang="ts">
  import type { TupleActionProps } from '@chobantonov/jsonforms-svelte';
  import type { Snippet } from 'svelte';
  import { Tooltip, Portal } from '@skeletonlabs/skeleton-svelte';
  import { PlusIcon, Trash2Icon } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { getPortalRootNodeGetter, getPortalTargetResolver } from '../util';
  let {
    label,
    ariaLabel,
    buttonClass,
    icon,
    disabled = false,
    kind = 'add',
    onmousedown,
    onclick,
  }: Omit<TupleActionProps, 'onclick'> & {
    ariaLabel?: string;
    buttonClass?: string;
    icon?: Snippet;
    onmousedown?: (event: MouseEvent) => void;
    onclick: (event: MouseEvent) => void;
  } = $props();
  const iconOnly = $derived(kind === 'add' || kind === 'delete');
  const getRootNode = getPortalRootNodeGetter();
  const resolvePortalTarget = getPortalTargetResolver();
  let focused = $state(false);
  let hovered = $state(false);
  let hoverTimer: ReturnType<typeof setTimeout> | undefined;
  let dismissed = $state(false);
  const tooltipOpen = $derived((focused || hovered) && !dismissed);
  const dismissOnEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') dismissed = true;
  };
  onMount(() => () => {
    clearTimeout(hoverTimer);
    window.removeEventListener('keydown', dismissOnEscape, true);
  });
</script>

{#if iconOnly}
  <Tooltip
    open={tooltipOpen}
    openDelay={0}
    {getRootNode}
    positioning={{ placement: 'top', strategy: 'fixed' }}
  >
    <Tooltip.Trigger
      type="button"
      class={buttonClass ??
        `btn-icon btn-icon-sm ${kind === 'delete' ? 'preset-filled-error-500' : 'preset-tonal'}`}
      {disabled}
      {onmousedown}
      {onclick}
      aria-label={ariaLabel ?? label}
      title={label}
      onpointerenter={() => {
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(() => {
          hovered = true;
          dismissed = false;
        }, 80);
      }}
      onpointerleave={() => {
        clearTimeout(hoverTimer);
        hovered = false;
      }}
      onfocus={() => {
        focused = true;
        dismissed = false;
        window.addEventListener('keydown', dismissOnEscape, true);
      }}
      onblur={() => {
        focused = false;
        window.removeEventListener('keydown', dismissOnEscape, true);
      }}
    >
      {#if icon}{@render icon()}{:else if kind === 'add'}<PlusIcon
          class="size-4"
        />{:else}<Trash2Icon class="size-4" />{/if}
    </Tooltip.Trigger>
    <Portal target={resolvePortalTarget() ?? undefined}>
      <Tooltip.Context>
        {#snippet children(tooltip)}
          <div {...tooltip().getPositionerProps()}>
            <Tooltip.Content class="card preset-filled-surface-950-50 px-3 py-2 text-sm shadow-xl"
              >{label}</Tooltip.Content
            >
          </div>
        {/snippet}
      </Tooltip.Context>
    </Portal>
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
