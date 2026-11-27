<script lang="ts">
  import { arrayCardProps } from '@chobantonov/jsonforms-svelte-renderer-common';
  import CollectionPanelToggle from '../components/CollectionPanelToggle.svelte';
  import {
    CollectionRows,
    ArrayTableFrame,
    ArrayTableToolbar,
    ArrayTableCell,
    type RendererProps,
    TableColumnResize,
    RowDetailDialog,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import RowDetailToggle from '../components/RowDetailToggle.svelte';
  import ConfirmationDialog from './components/ConfirmationDialog.svelte';
  import type { ControlElement } from '@jsonforms/core';
  import {
    Button,
    Card,
    Heading,
    P,
    Span,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
    Tooltip,
  } from 'flowbite-svelte';
  import {
    ChevronDownOutline,
    ChevronUpOutline,
    PlusOutline,
    PenOutline,
    TrashBinOutline,
  } from 'flowbite-svelte-icons';
  import { twMerge } from 'tailwind-merge';
  import { useFlowbiteTableControl } from '../util';

  import CollectionPager from '../components/CollectionPager.svelte';
  import DetailDialog from '../components/DetailDialog.svelte';
  import SectionIndicators from '../layouts/SectionIndicators.svelte';
  import RowDetailFrame from '../components/RowDetailFrame.svelte';

  const props: RendererProps<ControlElement> = $props();
  const panelContentId = $props.id();
  const { table, binding } = useFlowbiteTableControl(props);
  const { arrayMessage, panel, page, message, rowDetail, columnWidths, title } = table;
  const cardProps = $derived(
    arrayCardProps(
      binding.flowbiteProps('Card'),
      binding.styles.arrayList.root,
      'mt-1 mb-1 min-w-full',
      twMerge,
    ),
  );

  const tableProps = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Table');

    return {
      ...flowbiteProps,

      class: twMerge('w-full', flowbiteProps.class),
    };
  });
</script>

<ArrayTableFrame
  {binding}
  {table}
  {ConfirmationDialog}
  errorClass="my-2 text-sm text-red-600 dark:text-red-400"
>
  <Card {...cardProps}>
    <ArrayTableToolbar
      {binding}
      {table}
      {props}
      {panelContentId}
      {SectionIndicators}
      {RowDetailToggle}
      {CollectionPanelToggle}
      toolbarClass="flex items-center justify-between pt-2 pr-4 pb-2 pl-4 {binding.styles.arrayList
        .toolbar || ''}"
      titleClass={`flex items-center gap-2 ${binding.styles.arrayList.title || ''}`}
    >
      {#snippet heading()}<Heading
          tag="h3"
          class="text-lg font-semibold {binding.styles.arrayList.label || ''}"
        >
          {binding.computedLabel}
        </Heading>{/snippet}
      <Button
        color="red"
        size="sm"
        data-delete-selected
        disabled={!table.canDeleteSelected}
        onclick={table.deleteSelected}
        aria-label={message('collection.deleteSelected')}
        title={message('collection.deleteSelected')}><TrashBinOutline class="h-4 w-4" /></Button
      >
      <Tooltip>
        <Span>{message('collection.deleteSelected')}</Span>
      </Tooltip>
      <Button
        color="primary"
        size="sm"
        disabled={table.addDisabled}
        onclick={table.addButtonClick}
        aria-label={arrayMessage('addAriaLabel')}
        title={arrayMessage('addTooltip')}
        class={binding.styles.arrayList?.addButton || ''}
      >
        <PlusOutline class="h-4 w-4" />
      </Button>
      <Tooltip>
        <Span>{arrayMessage('addTooltip')}</Span>
      </Tooltip>
    </ArrayTableToolbar>
    <div id={panelContentId} hidden={panel.collapsed}>
      <RowDetailFrame {...table.frameProps}>
        <div class="pr-4 pl-4">
          <div class="w-full overflow-x-auto">
            <Table hoverable={true} {...tableProps} style={columnWidths.tableStyle}>
              {#if table.tableColumns.length > 0 || rowDetail.options}
                <TableHead>
                  <TableHeadCell scope="col" class="w-8 px-2 text-center" data-column-selection>
                    <input
                      type="checkbox"
                      class="text-primary-600 focus:ring-primary-500 size-4 rounded border-gray-300"
                      {...table.pageCheckbox}
                      onchange={(event) => table.selectPage(event.currentTarget.checked)}
                    />
                  </TableHeadCell>
                  {#each table.validColumnProps as prop (prop)}
                    <TableHeadCell
                      scope="col"
                      data-column-field={prop}
                      style={`position:relative;${table.columnStyle(prop)}`}
                    >
                      {title(prop)}{#if table.showAsterisk(prop)}<Span
                          aria-hidden="true"
                          class={binding.styles?.control?.asterisk ??
                            'text-red-600 dark:text-red-400'}>*</Span
                        >
                      {/if}
                      <TableColumnResize {...table.resizeAttributes(prop)} />
                    </TableHeadCell>
                  {/each}
                  {#if rowDetail.options}<TableHeadCell></TableHeadCell>{/if}
                  {#if table.showSortButtons}
                    <TableHeadCell class="w-[100px] text-center"></TableHeadCell>
                  {/if}
                </TableHead>
              {/if}

              <TableBody>
                <CollectionRows indices={page.indices} control={binding.control}>
                  {#snippet children(index)}
                    <TableBodyRow
                      data-array-row-index={index}
                      tabindex={-1}
                      class={twMerge(
                        binding.styles.arrayList?.item,
                        rowDetail.visible &&
                          rowDetail.selectedIndex === index &&
                          'bg-gray-100 dark:bg-gray-700',
                      )}
                      {...table.rowAttributes(index)}
                    >
                      <TableBodyCell class="w-8 px-2 text-center" data-row-selection>
                        <input
                          type="checkbox"
                          class="text-primary-600 focus:ring-primary-500 size-4 rounded border-gray-300"
                          {...table.rowCheckbox(index)}
                          onchange={(event) => table.selectRow(index, event.currentTarget.checked)}
                        />
                      </TableBodyCell>
                      {#each table.validColumnProps as propName (propName)}
                        <TableBodyCell
                          style={table.columnStyle(propName)}
                          class="overflow-hidden px-4 py-2"
                        >
                          <ArrayTableCell control={binding.control} {table} {index} {propName} />
                        </TableBodyCell>
                      {/each}
                      {#if table.rowDialog}
                        <TableBodyCell class="px-4 py-2">
                          <RowDetailDialog
                            Dialog={DetailDialog}
                            {...table.dialogProps(index, table.rowDialog)}
                          />
                        </TableBodyCell>
                      {:else if table.rowPanel}
                        <TableBodyCell class="px-4 py-2">
                          <Button
                            type="button"
                            color="alternative"
                            size="xs"
                            aria-label={message('collection.editRowDetails', { index: index + 1 })}
                            onclick={() => rowDetail.select(index, true)}
                            ><PenOutline class="size-4" /></Button
                          >
                          <Tooltip>
                            {message('collection.editRowDetails', { index: index + 1 })}
                          </Tooltip>
                        </TableBodyCell>
                      {/if}
                      {#if table.showSortButtons}
                        <TableBodyCell class="w-[100px] px-4 py-2 text-center">
                          <div class="flex items-center justify-center gap-1">
                            <Button
                              color="alternative"
                              size="xs"
                              {...table.moveButton(index, 'up')}
                              aria-label={arrayMessage('upAriaLabel')}
                              title={arrayMessage('up')}
                              class={binding.styles.arrayList?.itemMoveUp || ''}
                            >
                              <ChevronUpOutline class="h-3 w-3" />
                            </Button>
                            <Tooltip>
                              <Span>{arrayMessage('up')}</Span>
                            </Tooltip>

                            <Button
                              color="alternative"
                              size="xs"
                              {...table.moveButton(index, 'down')}
                              aria-label={arrayMessage('downAriaLabel')}
                              title={arrayMessage('down')}
                              class={binding.styles.arrayList?.itemMoveDown || ''}
                            >
                              <ChevronDownOutline class="h-3 w-3" />
                            </Button>
                            <Tooltip>
                              <Span>{arrayMessage('down')}</Span>
                            </Tooltip>
                          </div>
                        </TableBodyCell>
                      {/if}
                    </TableBodyRow>
                  {/snippet}
                </CollectionRows>
                {#if table.dataLength == 0}
                  <TableBodyRow class={binding.styles.arrayList?.item || ''}>
                    <TableBodyCell class="px-4 text-center" colspan={table.columnCount}>
                      <P class="text-center {binding.styles.arrayList?.noData || ''}">
                        {arrayMessage('noDataMessage')}
                      </P>
                    </TableBodyCell>
                  </TableBodyRow>
                {/if}
              </TableBody>
            </Table>
          </div>
        </div>
        <CollectionPager {page} />
      </RowDetailFrame>
    </div>
  </Card>
</ArrayTableFrame>
