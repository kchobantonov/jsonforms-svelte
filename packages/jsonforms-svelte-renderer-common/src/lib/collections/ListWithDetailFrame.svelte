<script lang="ts">
  import type { Component, ComponentProps, Snippet } from 'svelte';
  import type { useListWithDetail } from './listWithDetail.svelte';
  import ListDetailPanes from './ListDetailPanes.svelte';
  type List = ReturnType<typeof useListWithDetail>;
  const {
    binding,
    list,
    ValidationIcon,
    CollectionPanelToggle,
    ConfirmationDialog,
    heading,
    addAction,
    TupleAction,
    addButtonClass,
    noData,
    emptyClass,
    toolbarClass,
    ...panes
  }: Omit<ComponentProps<typeof ListDetailPanes>, 'control'> & {
    binding: Parameters<typeof useListWithDetail>[1] & { computedLabel: string };
    ValidationIcon: Component<{ errors: List['headerErrors']; 'data-array-summary'?: boolean }>;
    CollectionPanelToggle: Component<{ panel: List['panel']; id: string; label: string }>;
    ConfirmationDialog: Component<{ operation: 'delete'; onAccept(): void; onCancel(): void }>;
    heading?: Snippet;
    addAction?: Snippet;
    TupleAction?: Component<{
      kind: 'add';
      buttonClass?: string;
      disabled: boolean;
      label: string;
      ariaLabel: string;
      onclick: () => void;
    }>;
    addButtonClass?: string;
    noData?: Snippet;
    emptyClass?: string;
    toolbarClass: string;
  } = $props();
  const panelContentId = $props.id();
</script>

{#snippet toolbar()}
  <div class={toolbarClass}>
    <div class="flex items-center gap-2">
      {#if heading}{@render heading()}{:else}<h3 class="text-lg font-semibold">
          {binding.computedLabel}
        </h3>{/if}
      {#if list.headerErrors.length && binding.appliedOptions.showValidationIndicator !== false}
        <ValidationIcon data-array-summary errors={list.headerErrors} />
      {/if}
    </div>
    <div class="flex items-center gap-2">
      <CollectionPanelToggle panel={list.panel} id={panelContentId} label={binding.computedLabel} />
      {#if addAction}{@render addAction()}{:else if TupleAction}<TupleAction
          kind="add"
          label={list.arrayMessage('addTooltip')}
          ariaLabel={list.arrayMessage('addAriaLabel')}
          disabled={list.addDisabled}
          onclick={list.addButtonClick}
          buttonClass={addButtonClass}
        />{/if}
    </div>
  </div>
{/snippet}

{#if binding.control.visible}
  {#if binding.control.errors}
    <p role="alert" data-array-own-errors class="my-2 text-sm">{binding.control.errors}</p>
  {/if}
  <div class="flex h-full w-full flex-col">
    {@render toolbar()}
    <div
      id={panelContentId}
      hidden={list.panel.collapsed}
      class="flex min-h-0 flex-1 flex-col"
      style:display={list.panel.collapsed ? 'none' : 'flex'}
    >
      {#if list.dataLength === 0}
        {#if noData}{@render noData()}{:else}<p class={emptyClass}>
            {list.arrayMessage('noDataMessage')}
          </p>{/if}
      {:else}
        <ListDetailPanes {...panes} {list} control={binding.control} />
      {/if}
    </div>
  </div>
  {#if list.deletion.pending}
    <ConfirmationDialog
      operation="delete"
      onAccept={list.deletion.accept}
      onCancel={list.deletion.cancel}
    />
  {/if}
{/if}
