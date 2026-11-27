<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  import type { useArrayTable } from './arrayTable.svelte';
  import type { SectionIndicatorProps } from '../layout/sectionIndicators.svelte';
  const {
    binding,
    table,
    props,
    panelContentId,
    SectionIndicators,
    CollectionPanelToggle,
    RowDetailToggle,
    heading,
    labelClass,
    TupleAction,
    addButtonClass,
    children,
    toolbarClass,
    titleClass,
  }: {
    binding: Parameters<typeof useArrayTable>[1];
    table: ReturnType<typeof useArrayTable>;
    props: Parameters<typeof useArrayTable>[0];
    panelContentId: string;
    SectionIndicators: Component<SectionIndicatorProps>;
    CollectionPanelToggle: Component<{
      panel: ReturnType<typeof useArrayTable>['panel'];
      id: string;
      label: string;
    }>;
    RowDetailToggle: Component<{
      open: boolean;
      disabled: boolean;
      onclick: () => void;
      label: string;
    }>;
    heading?: Snippet;
    labelClass?: string;
    children?: Snippet;
    TupleAction?: Component<{
      kind: 'add' | 'delete';
      label: string;
      ariaLabel?: string;
      buttonClass?: string;
      dataDeleteSelected?: boolean;
      disabled: boolean;
      onclick: (event: MouseEvent) => void;
    }>;
    addButtonClass?: string;
    toolbarClass: string;
    titleClass: string;
  } = $props();
  const { rowDetail, message, panel } = $derived(table);
</script>

<div class={toolbarClass}>
  <div class={titleClass}>
    {#if heading}{@render heading()}{:else}<h3 class={labelClass}>{binding.computedLabel}</h3>{/if}
    {#if binding.appliedOptions.showValidationIndicator !== false && (binding.control.errors || (!binding.appliedOptions.hideArraySummaryValidation && binding.appliedOptions.showValidationIndicator === true))}
      <SectionIndicators
        uischema={binding.control.uischema}
        path={props.path}
        pathSegments={props.pathSegments}
        errorMessage={binding.control.errors}
        errorSource="array"
        showData={false}
      />
    {/if}
  </div>
  <div class="flex items-center gap-2" data-array-actions>
    <CollectionPanelToggle {panel} id={panelContentId} label={binding.computedLabel} />
    {#if table.rowPanel}
      <RowDetailToggle
        open={rowDetail.panelOpen}
        disabled={false}
        onclick={rowDetail.toggle}
        label={message(rowDetail.panelOpen ? 'collection.hideDetails' : 'collection.showDetails')}
      />
    {/if}
    {#if TupleAction}
      <TupleAction
        kind="delete"
        label={message('collection.deleteSelected')}
        dataDeleteSelected
        disabled={!table.canDeleteSelected}
        onclick={table.deleteSelected}
      />
      <TupleAction
        kind="add"
        label={table.arrayMessage('addTooltip')}
        ariaLabel={table.arrayMessage('addAriaLabel')}
        buttonClass={addButtonClass}
        disabled={table.addDisabled}
        onclick={table.addButtonClick}
      />
    {:else}
      {@render children?.()}
    {/if}
  </div>
</div>
