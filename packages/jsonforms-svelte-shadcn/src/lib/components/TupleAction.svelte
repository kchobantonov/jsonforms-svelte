<script lang="ts">
  import type { TupleActionProps } from '@chobantonov/jsonforms-svelte';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import * as Tooltip from '@jsonforms-svelte-shadcn-ui/tooltip';
  import { PlusIcon, Trash2Icon } from '$lib/components/icons';
  import { getPortalTarget } from '../util';
  let { label, disabled = false, kind = 'add', onclick }: TupleActionProps = $props();
  const iconOnly = $derived(kind === 'add' || kind === 'delete');
</script>

{#if iconOnly}
  <Tooltip.Provider
    ><Tooltip.Root
      ><Tooltip.Trigger>
        {#snippet child({ props })}<span {...props} class="inline-flex">
            <Button
              type="button"
              size="icon-sm"
              variant={kind === 'delete' ? 'destructive' : 'default'}
              {disabled}
              {onclick}
              aria-label={label}
              title={label}
            >
              {#if kind === 'add'}<PlusIcon class="size-4" />{:else}<Trash2Icon
                  class="size-4"
                />{/if}
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
