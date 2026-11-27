<script lang="ts">
  import { ArrayMoveButtons } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { arrayCardProps } from '@chobantonov/jsonforms-svelte-renderer-common';
  import TooltipContent from '../components/TooltipContent.svelte';
  import CollectionPanelToggle from '../components/CollectionPanelToggle.svelte';
  import {
    CollectionRows,
    ArrayTableFrame,
    ArrayTableToolbar,
    arrayToolbarClasses,
    ArrayTableCell,
    type RendererProps,
    TableColumnResize,
    RowDetailDialog,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import RowDetailToggle from '../components/RowDetailToggle.svelte';
  import TupleAction from '../components/TupleAction.svelte';
  import ConfirmationDialog from './components/ConfirmationDialog.svelte';
  import type { ControlElement } from '@jsonforms/core';
  import {
    ChevronDownIcon as ChevronDownOutline,
    ChevronUpIcon as ChevronUpOutline,
    PencilIcon,
  } from '@lucide/svelte';
  import { Tooltip } from '@skeletonlabs/skeleton-svelte';
  import { twMerge } from 'tailwind-merge';
  import {
    getPortalRootNodeGetter,
    getPortalTargetResolver,
    useSkeletonTableControl,
  } from '../util';

  import CollectionPager from '../components/CollectionPager.svelte';
  import DetailDialog from '../components/DetailDialog.svelte';
  import RowDetailFrame from '../components/RowDetailFrame.svelte';
  import SectionIndicators from '../layouts/SectionIndicators.svelte';

  const props: RendererProps<ControlElement> = $props();
  const getRootNode = getPortalRootNodeGetter();
  const resolvePortalTarget = getPortalTargetResolver();
  const panelContentId = $props.id();
  const { table, binding } = useSkeletonTableControl(props);
  const { arrayMessage, panel, page, message, rowDetail, columnWidths, title } = table;
  const actionColClass = 'w-[100px]';
  const cardProps = $derived(
    arrayCardProps(
      binding.skeletonProps('card'),
      binding.styles.arrayList.root,
      'card preset-outlined-surface-200-800 mt-1 mb-1 min-w-full',
      twMerge,
    ),
  );
</script>

<ArrayTableFrame
  {binding}
  {table}
  {ConfirmationDialog}
  errorClass="text-error-600 dark:text-error-400 my-2 text-sm"
>
  <section {...cardProps}>
    <!-- Toolbar -->
    <ArrayTableToolbar
      {binding}
      {table}
      {props}
      {panelContentId}
      {SectionIndicators}
      {RowDetailToggle}
      {CollectionPanelToggle}
      {...arrayToolbarClasses(binding.styles.arrayList, twMerge)}
      {TupleAction}
      addButtonClass={twMerge('btn btn-sm preset-filled', binding.styles.arrayList?.addButton)}
    />
    <div id={panelContentId} hidden={panel.collapsed}>
      <RowDetailFrame {...table.frameProps}>
        <!-- Table -->
        <div class="px-4 pb-4">
          <div class="w-full overflow-x-auto">
            <table class="table w-full" style={columnWidths.tableStyle}>
              {#if table.tableColumns.length > 0 || rowDetail.options}
                <thead>
                  <tr>
                    <th scope="col" class="w-8 px-2 text-center" data-column-selection>
                      <input
                        type="checkbox"
                        class="checkbox border-surface-400-600 border"
                        {...table.pageCheckbox}
                        onchange={(event) => table.selectPage(event.currentTarget.checked)}
                      />
                    </th>
                    {#each table.validColumnProps as prop (prop)}
                      <th
                        scope="col"
                        data-column-field={prop}
                        style={`position:relative;${table.columnStyle(prop)}`}
                      >
                        {title(prop)}
                        {#if table.showAsterisk(prop)}
                          <span
                            aria-hidden="true"
                            class={twMerge(
                              'text-error-500 dark:text-error-400 ms-0.5',
                              binding.styles?.control?.asterisk,
                            )}>*</span
                          >
                        {/if}
                        <TableColumnResize {...table.resizeAttributes(prop)} />
                      </th>
                    {/each}
                    {#if rowDetail.options}<th></th>{/if}
                    {#if table.showSortButtons}
                      <th class={twMerge('text-center', actionColClass)}></th>
                    {/if}
                  </tr>
                </thead>
              {/if}

              <tbody>
                <CollectionRows indices={page.indices} control={binding.control}>
                  {#snippet children(index)}
                    <tr
                      data-array-row-index={index}
                      tabindex={-1}
                      class={twMerge(
                        binding.styles.arrayList?.item,
                        rowDetail.visible &&
                          rowDetail.selectedIndex === index &&
                          'preset-tonal-primary',
                      )}
                      {...table.rowAttributes(index)}
                    >
                      <td class="w-8 px-2 text-center" data-row-selection>
                        <input
                          type="checkbox"
                          class="checkbox border-surface-400-600 border"
                          {...table.rowCheckbox(index)}
                          onchange={(event) => table.selectRow(index, event.currentTarget.checked)}
                        />
                      </td>
                      {#each table.validColumnProps as propName (propName)}
                        <td style={table.columnStyle(propName)} class="overflow-hidden px-4 py-2">
                          <ArrayTableCell control={binding.control} {table} {index} {propName} />
                        </td>
                      {/each}

                      {#if table.rowDialog}
                        <td class="px-4 py-2">
                          <RowDetailDialog
                            Dialog={DetailDialog}
                            {...table.dialogProps(index, table.rowDialog)}
                          />
                        </td>
                      {:else if table.rowPanel}
                        <td class="px-4 py-2">
                          <Tooltip
                            openDelay={0}
                            {getRootNode}
                            positioning={{ placement: 'top', strategy: 'fixed' }}
                          >
                            <Tooltip.Trigger
                              type="button"
                              class="btn-icon btn-icon-sm preset-tonal"
                              aria-label={message('collection.editRowDetails', {
                                index: index + 1,
                              })}
                              onclick={() => rowDetail.select(index, true)}
                              ><PencilIcon class="size-4" /></Tooltip.Trigger
                            >
                            <TooltipContent target={resolvePortalTarget() ?? undefined}
                              >{message('collection.editRowDetails', {
                                index: index + 1,
                              })}</TooltipContent
                            >
                          </Tooltip>
                        </td>
                      {/if}
                      {#if table.showSortButtons}
                        <td class={twMerge('px-4 py-2 text-center', actionColClass)}>
                          <ArrayMoveButtons
                            {index}
                            move={table.moveAction}
                            {TupleAction}
                            Up={ChevronUpOutline}
                            Down={ChevronDownOutline}
                            style={(direction) =>
                              twMerge(
                                'btn btn-sm preset-outlined',
                                binding.styles.arrayList?.[
                                  direction === 'up' ? 'itemMoveUp' : 'itemMoveDown'
                                ],
                              )}
                          />
                        </td>
                      {/if}
                    </tr>
                  {/snippet}
                </CollectionRows>

                {#if table.dataLength === 0}
                  <tr>
                    <td class="px-4 py-2 text-center" colspan={table.columnCount}>
                      <p class={twMerge('text-center', binding.styles.arrayList?.noData)}>
                        {arrayMessage('noDataMessage')}
                      </p>
                    </td>
                  </tr>
                {/if}
              </tbody>
            </table>
          </div>
        </div>
        <CollectionPager {page} />
      </RowDetailFrame>
    </div>
  </section>
</ArrayTableFrame>
