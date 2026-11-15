<script lang="ts">
  import type { TupleActionProps } from '@chobantonov/jsonforms-svelte';
  import type { Snippet } from 'svelte';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import * as Tooltip from '@jsonforms-svelte-shadcn-ui/tooltip';
  import { PlusIcon, Trash2Icon } from '$lib/components/icons';
  import { getPortalTarget } from '../util';
  let {
    label,
    ariaLabel,
    buttonSize = 'icon-sm',
    buttonVariant,
    buttonClass,
    dataDeleteSelected = false,
    icon,
    disabled = false,
    kind = 'add',
    onmousedown,
    onclick,
  }: Omit<TupleActionProps, 'onclick'> & {
    ariaLabel?: string;
    buttonSize?: 'icon-xs' | 'icon-sm';
    buttonVariant?: 'default' | 'outline' | 'destructive' | 'ghost';
    buttonClass?: string;
    dataDeleteSelected?: boolean;
    icon?: Snippet;
    onmousedown?: (event: MouseEvent) => void;
    onclick: (event: MouseEvent) => void;
  } = $props();
  const iconOnly = $derived(kind === 'add' || kind === 'delete');
  let focused = $state(false);
  let hovered = $state(false);
  let dismissed = $state(false);
  const tooltipOpen = $derived((focused || hovered) && !dismissed);
</script>

{#if iconOnly}
  <Tooltip.Provider
    ><Tooltip.Root open={tooltipOpen}
      ><Tooltip.Trigger>
        {#snippet child({ props })}<span
            {...props}
            class="inline-flex"
            onfocusin={() => {
              focused = true;
              dismissed = false;
            }}
            onfocusout={() => (focused = false)}
            onpointerenter={() => {
              hovered = true;
              dismissed = false;
            }}
            onpointerleave={() => (hovered = false)}
            onkeydowncapture={(event) => {
              if (event.key === 'Escape') dismissed = true;
            }}
          >
            <Button
              type="button"
              size={buttonSize}
              variant={buttonVariant ?? (kind === 'delete' ? 'destructive' : 'default')}
              class={buttonClass}
              {disabled}
              {onmousedown}
              {onclick}
              aria-label={ariaLabel ?? label}
              title={label}
              data-delete-selected={dataDeleteSelected ? '' : undefined}
            >
              {#if icon}{@render icon()}{:else if kind === 'add'}<PlusIcon
                  class="size-4"
                />{:else}<Trash2Icon class="size-4" />{/if}
            </Button>
          </span>{/snippet}
      </Tooltip.Trigger><Tooltip.Content portalProps={{ to: getPortalTarget() }}
        >{label}</Tooltip.Content
      ></Tooltip.Root
    ></Tooltip.Provider
  >
{:else}
  <Button
    type="button"
    size="sm"
    variant={kind === 'remove' ? 'destructive' : 'outline'}
    {disabled}
    {onclick}>{label}</Button
  >
{/if}
