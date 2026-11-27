<script lang="ts">
  import { ArrayMoveButtons } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { arrayCardProps } from '@chobantonov/jsonforms-svelte-renderer-common';
  import CollectionPanelToggle from '../components/CollectionPanelToggle.svelte';
  import TooltipContent from '../components/TooltipContent.svelte';
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
  import { mergeProps } from 'bits-ui';
  import RowDetailToggle from '../components/RowDetailToggle.svelte';
  import TupleAction from '../components/TupleAction.svelte';
  import ConfirmationDialog from './components/ConfirmationDialog.svelte';
  import type { ControlElement } from '@jsonforms/core';
  import {
    ChevronDownIcon as ChevronDownOutline,
    ChevronUpIcon as ChevronUpOutline,
    PencilIcon,
  } from '$lib/components/icons';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import { Checkbox } from '@jsonforms-svelte-shadcn-ui/checkbox';
  import * as Card from '@jsonforms-svelte-shadcn-ui/card';
  import * as Table from '@jsonforms-svelte-shadcn-ui/table';
  import * as Tooltip from '@jsonforms-svelte-shadcn-ui/tooltip';
  import { twMerge } from 'tailwind-merge';
  import { useShadcnTableControl } from '../util';

  import CollectionPager from '../components/CollectionPager.svelte';
  import DetailDialog from '../components/DetailDialog.svelte';
  import RowDetailFrame from '../components/RowDetailFrame.svelte';
  import SectionIndicators from '../layouts/SectionIndicators.svelte';

  const props: RendererProps<ControlElement> = $props();
  const panelContentId = $props.id();
  const { table, binding } = useShadcnTableControl(props);
  const { arrayMessage, panel, page, message, rowDetail, columnWidths, title } = table;
  const actionColClass = $derived(table.showSortButtons ? 'w-[100px]' : 'w-[50px]');
  const cardProps = $derived(
    arrayCardProps(
      binding.shadcnProps('card'),
      binding.styles.arrayList.root,
      'my-1 min-w-full',
      twMerge,
    ),
  );
</script>

<ArrayTableFrame {binding} {table} {ConfirmationDialog} errorClass="text-destructive my-2 text-sm">
  <Card.Root {...cardProps}>
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
      addButtonClass={binding.styles.arrayList?.addButton}
    />
    <div id={panelContentId} hidden={panel.collapsed}>
      <RowDetailFrame {...table.frameProps}>
        <!-- Table -->
        <div class="px-4 pb-4">
          <Table.Root style={columnWidths.tableStyle} aria-label={binding.computedLabel}>
            {#if table.tableColumns.length > 0 || rowDetail.options}
              <Table.Header>
                <Table.Row class="border-border/60">
                  <Table.Head scope="col" class="w-8 px-2 text-center" data-column-selection>
                    <Checkbox
                      {...table.pageCheckbox}
                      onCheckedChange={(checked) => table.selectPage(checked === true)}
                    />
                  </Table.Head>
                  {#each table.validColumnProps as prop (prop)}
                    <Table.Head
                      scope="col"
                      data-column-field={prop}
                      style={`position:relative;${table.columnStyle(prop)}`}
                    >
                      {title(prop)}
                      {#if table.showAsterisk(prop)}
                        <span
                          aria-hidden="true"
                          class={twMerge(
                            'text-destructive ms-0.5',
                            binding.styles?.control?.asterisk,
                          )}>*</span
                        >
                      {/if}
                      <TableColumnResize {...table.resizeAttributes(prop)} />
                    </Table.Head>
                  {/each}
                  {#if rowDetail.options}<Table.Head></Table.Head>{/if}
                  {#if table.showSortButtons}
                    <Table.Head class={twMerge('text-center', actionColClass)}></Table.Head>
                  {/if}
                </Table.Row>
              </Table.Header>
            {/if}

            <Table.Body>
              <CollectionRows indices={page.indices} control={binding.control}>
                {#snippet children(index)}
                  <Table.Row
                    data-array-row-index={index}
                    tabindex={-1}
                    class={twMerge(
                      'border-border/60',
                      binding.styles.arrayList?.item,
                      rowDetail.visible && rowDetail.selectedIndex === index && 'bg-muted',
                    )}
                    {...table.rowAttributes(index)}
                  >
                    <Table.Cell class="w-8 px-2 text-center" data-row-selection>
                      <Checkbox
                        {...table.rowCheckbox(index)}
                        onCheckedChange={(checked) => table.selectRow(index, checked === true)}
                      />
                    </Table.Cell>
                    {#each table.validColumnProps as propName (propName)}
                      <Table.Cell
                        style={table.columnStyle(propName)}
                        class="overflow-hidden px-4 py-2"
                      >
                        <ArrayTableCell control={binding.control} {table} {index} {propName} />
                      </Table.Cell>
                    {/each}

                    {#if table.rowDialog}
                      <Table.Cell class="px-4 py-2">
                        <RowDetailDialog
                          Dialog={DetailDialog}
                          {...table.dialogProps(index, table.rowDialog)}
                        />
                      </Table.Cell>
                    {:else if table.rowPanel}
                      <Table.Cell class="px-4 py-2">
                        <Tooltip.Provider>
                          <Tooltip.Root>
                            <Tooltip.Trigger>
                              {#snippet child({ props: triggerProps })}
                                <Button
                                  {...mergeProps(triggerProps, {
                                    onclick: () => rowDetail.select(index, true),
                                  })}
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label={message('collection.editRowDetails', {
                                    index: index + 1,
                                  })}><PencilIcon class="size-4" /></Button
                                >
                              {/snippet}
                            </Tooltip.Trigger>
                            <TooltipContent>
                              {message('collection.editRowDetails', { index: index + 1 })}
                            </TooltipContent>
                          </Tooltip.Root>
                        </Tooltip.Provider>
                      </Table.Cell>
                    {/if}
                    {#if table.showSortButtons}
                      <Table.Cell class={twMerge('px-4 py-2 text-center', actionColClass)}>
                        <ArrayMoveButtons
                          {index}
                          move={table.moveAction}
                          {TupleAction}
                          Up={ChevronUpOutline}
                          Down={ChevronDownOutline}
                          buttonProps={{ buttonVariant: 'outline', buttonSize: 'icon-xs' }}
                          style={(direction) =>
                            twMerge(
                              binding.styles.arrayList?.[
                                direction === 'up' ? 'itemMoveUp' : 'itemMoveDown'
                              ],
                            )}
                        />
                      </Table.Cell>
                    {/if}
                  </Table.Row>
                {/snippet}
              </CollectionRows>

              {#if table.dataLength === 0}
                <Table.Row>
                  <Table.Cell
                    class="px-4 py-2 text-center"
                    colspan={1 +
                      table.validColumnProps.length +
                      (rowDetail.options ? 1 : 0) +
                      (table.showSortButtons ? 1 : 0)}
                  >
                    <p class={twMerge('text-center', binding.styles.arrayList?.noData)}>
                      {arrayMessage('noDataMessage')}
                    </p>
                  </Table.Cell>
                </Table.Row>
              {/if}
            </Table.Body>
          </Table.Root>
        </div>
        <CollectionPager {page} />
      </RowDetailFrame>
    </div>
  </Card.Root>
</ArrayTableFrame>
