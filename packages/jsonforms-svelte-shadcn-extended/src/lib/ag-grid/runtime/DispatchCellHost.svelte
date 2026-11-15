<script lang="ts">
  import { CollectionItem } from '@chobantonov/jsonforms-svelte';
  import {
    DispatchCell,
    RowDetailDialog,
    useRendererMessages,
  } from '@chobantonov/jsonforms-svelte';
  import {
    DetailDialog,
    PencilIcon,
    ValidationIcon,
    getPortalTargetResolver,
  } from '@chobantonov/jsonforms-svelte-shadcn';
  import { untrack } from 'svelte';
  import type { AgGridCellHostProps } from '../types.js';

  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import * as Tooltip from '@jsonforms-svelte-shadcn-ui/tooltip';
  let { initialProps }: { initialProps: AgGridCellHostProps } = $props();
  const message = useRendererMessages();
  const resolvePortalTarget = getPortalTargetResolver();
  let current = $state.raw(untrack(() => initialProps));

  export function refresh(next: AgGridCellHostProps) {
    current = next;
  }
</script>

{#snippet content()}
  {#if current.rowDetail}
    <span class="inline-flex items-center gap-1">
      {#if current.rowDetail!.options.presentation === 'dialog'}
        <RowDetailDialog
          Dialog={DetailDialog}
          schema={current.schema}
          path={current.path}
          scope={current.rowDetail!.scope}
          options={current.rowDetail!.options}
          enabled={current.enabled}
          index={current.rowDetail!.index}
          prepare={current.rowDetail!.prepare}
        />
      {:else}
        <Tooltip.Provider
          ><Tooltip.Root
            ><Tooltip.Trigger>
              {#snippet child({ props: triggerProps })}
                <Button
                  {...triggerProps}
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={message('collection.editRowDetails', {
                    index: current.rowDetail!.index + 1,
                  })}
                  title={message('collection.editRowDetails', {
                    index: current.rowDetail!.index + 1,
                  })}
                  aria-current={current.rowDetail!.selected ? 'true' : undefined}
                  data-row-detail-selected={current.rowDetail!.selected}
                  onclick={current.rowDetail!.select}
                  ><PencilIcon class="size-4" />
                </Button>
              {/snippet}
            </Tooltip.Trigger><Tooltip.Content
              portalProps={{ to: resolvePortalTarget() ?? undefined }}
              >{message('collection.editRowDetails', {
                index: current.rowDetail!.index + 1,
              })}</Tooltip.Content
            ></Tooltip.Root
          ></Tooltip.Provider
        >
      {/if}
      <ValidationIcon data-row-detail-errors errors={current.rowDetail!.errors} />
    </span>
  {:else}
    <DispatchCell {...current} />
  {/if}
{/snippet}
{#key current.item?.key}
  {#if current.item}
    <CollectionItem
      identity={current.item.key}
      path={current.item.path}
      sourceItem={current.item.sourceItem}
      children={content}
    />
  {:else}
    {@render content()}
  {/if}
{/key}
