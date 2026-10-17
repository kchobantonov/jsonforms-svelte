<script lang="ts">
  import { useDeletionConfirmation } from '@chobantonov/jsonforms-svelte';
  import ConfirmationDialog from '../complex/components/ConfirmationDialog.svelte';
  import {
    DispatchCell,
    useCollectionPagination,
    collectionErrorPositions,
    resolveTableColumns,
    useTableColumnWidths,
    TableColumnResize,
    RowDetailDialog,
    useRowDetailPanel,
    useRendererMessages,
    useJsonForms,
    useJsonFormsArrayControl,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte';
  import {
    composePaths,
    getI18nKey,
    createDefaultValue,
    Resolve,
    type ControlElement,
    type JsonSchema,
  } from '@jsonforms/core';
  import {
    ChevronDownIcon as ChevronDownOutline,
    ChevronUpIcon as ChevronUpOutline,
    PlusIcon as PlusOutline,
    Trash2Icon as TrashBinOutline,
  } from '$lib/components/icons';
  import startCase from 'lodash/startCase';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import * as Card from '@jsonforms-svelte-shadcn-ui/card';
  import * as Table from '@jsonforms-svelte-shadcn-ui/table';
  import { twMerge } from 'tailwind-merge';
  import ValidationIcon from '../controls/components/ValidationIcon.svelte';
  import { useShadcnArrayControl } from '../util';

  import CollectionPager from '../components/CollectionPager.svelte';
  import DetailDialog from '../components/DetailDialog.svelte';
  import RowDetailFrame from '../components/RowDetailFrame.svelte';

  const props: RendererProps<ControlElement> = $props();
  const jsonforms = useJsonForms();
  const binding = useShadcnArrayControl(useJsonFormsArrayControl(props));

  const dataLength = $derived(binding.control.data ? binding.control.data.length : 0);

  const keys = $derived(Array.from({ length: dataLength }, (_, index) => index));
  const page = useCollectionPagination({
    get keys() {
      return keys;
    },
    get local() {
      return binding.control.uischema.options?.pagination;
    },
    get config() {
      return binding.control.config;
    },
    get errors() {
      return collectionErrorPositions(jsonforms.core, binding.control.path, keys);
    },
    kind: 'array',
  });

  const message = useRendererMessages();
  const rowDetail = useRowDetailPanel({
    options: () => binding.control.uischema.options?.rowDetail,
    rows: () => binding.control.data,
    prepare: page.prepare,
  });
  const rowDialog = $derived(
    rowDetail.options?.presentation === 'dialog' ? rowDetail.options : undefined,
  );
  const rowPanel = $derived(rowDetail.options?.presentation === 'panel');

  const tableColumns = $derived(
    resolveTableColumns(binding.control.schema, binding.control.uischema.options?.columnDefs),
  );
  const validColumnProps = $derived(tableColumns.map((column) => column.field));
  const wholeRow = (field: string) =>
    tableColumns.find((column) => column.field === field)?.scope === '#';
  const columnWidths = useTableColumnWidths(() => tableColumns);
  const columnStyle = columnWidths.style;

  const addDisabled = $derived(
    binding.appliedOptions.disableAdd === true ||
      !binding.control.enabled ||
      (binding.appliedOptions.restrict &&
        binding.control.arraySchema !== undefined &&
        binding.control.arraySchema.maxItems !== undefined &&
        dataLength >= binding.control.arraySchema.maxItems),
  );

  // Action column width depends on whether sort buttons are shown
  const actionColClass = $derived(
    binding.appliedOptions.showSortButtons ? 'w-[150px]' : 'w-[50px]',
  );

  function title(prop: string): string {
    const schema = resolveCellSchema(prop);
    const fallback = schema.title ?? (prop ? startCase(prop) : binding.computedLabel);
    const key = getI18nKey(schema, undefined, composePaths(binding.control.path, prop), 'label');
    return jsonforms.i18n?.translate?.(key, fallback, { schema }) ?? fallback;
  }

  function showAsterisk(prop: string): boolean {
    return binding.control.schema.required?.includes(prop) ?? false;
  }

  function resolveUiSchema(propName: string): ControlElement {
    const scope =
      binding.control.schema.properties && propName && !wholeRow(propName)
        ? `#/properties/${propName.replaceAll('~', '~0').replaceAll('/', '~1')}`
        : '#';
    const columnOptions = binding.control.uischema.options?.cells?.[propName];
    return { type: 'Control', scope, label: false, options: columnOptions };
  }

  function resolveCellSchema(propName: string): JsonSchema {
    if (!propName || wholeRow(propName)) return binding.control.schema;
    return (
      Resolve.schema(
        binding.control.schema,
        `#/properties/${propName.replaceAll('~', '~0').replaceAll('/', '~1')}`,
        binding.control.rootSchema,
      ) ??
      binding.control.schema.properties?.[propName] ??
      binding.control.schema
    );
  }

  function addButtonClick() {
    if (addDisabled || !page.prepare() || addDisabled) return;
    binding.addItem(
      binding.control.path,
      createDefaultValue(binding.control.schema, binding.control.rootSchema),
    )();
  }

  function moveUpClick(event: Event, toMove: number) {
    event.stopPropagation();
    if (!binding.control.enabled || toMove <= 0 || !page.prepare()) return;
    binding.moveUp?.(binding.control.path, toMove)();
  }

  function moveDownClick(event: Event, toMove: number) {
    event.stopPropagation();
    if (!binding.control.enabled || toMove >= dataLength - 1 || !page.prepare()) return;
    binding.moveDown?.(binding.control.path, toMove)();
  }

  const deletion = useDeletionConfirmation(
    () => ({
      ...binding.control,
      options: binding.control.uischema.options,
    }),
    'arrayTable',
    () => page.prepare(),
  );

  function removeItemsClick(event: Event, toDelete: number[]) {
    event.stopPropagation();
    const indices = [...new Set(toDelete)].filter(
      (index) => Number.isInteger(index) && index >= 0 && index < dataLength,
    );
    const allowed = () =>
      indices.length > 0 &&
      binding.appliedOptions.disableRemove !== true &&
      (!binding.appliedOptions.restrict ||
        dataLength - indices.length >= (binding.control.arraySchema?.minItems ?? 0));
    deletion.request(
      () => indices.map((index) => binding.control.data[index]),
      () => binding.removeItems?.(binding.control.path, indices)(),
      allowed,
    );
  }

  function isDeleteDisabled(): boolean {
    return (
      binding.appliedOptions.disableRemove === true ||
      !binding.control.enabled ||
      (binding.appliedOptions.restrict &&
        binding.control.arraySchema !== undefined &&
        binding.control.arraySchema.minItems !== undefined &&
        dataLength <= binding.control.arraySchema.minItems)
    );
  }

  const cardProps = $derived.by(() => {
    const shadcnProps = binding.shadcnProps('card');
    return {
      ...shadcnProps,
      class: twMerge('my-1 min-w-full', binding.styles.arrayList.root, shadcnProps.class),
    };
  });
</script>

{#if binding.control.visible}
  {#if binding.control.errors}
    <p role="alert" data-array-own-errors class="my-2 text-sm">{binding.control.errors}</p>
  {/if}
  <Card.Root {...cardProps}>
    <!-- Toolbar -->
    <div
      class={twMerge(
        'flex items-center justify-between px-4 py-2',
        binding.styles.arrayList.toolbar,
      )}
    >
      <div class={twMerge('flex items-center gap-2', binding.styles.arrayList.title)}>
        <h3 class={twMerge('text-lg font-semibold', binding.styles.arrayList.label)}>
          {binding.computedLabel}
        </h3>
        {#if binding.control.childErrors.length > 0 && !binding.appliedOptions.hideArraySummaryValidation && binding.appliedOptions.showValidationIndicator !== false}
          <ValidationIcon
            data-array-summary
            errors={binding.control.childErrors}
            class={binding.styles.arrayList.validationIcon}
          />
        {/if}
      </div>

      {#if rowPanel}
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-expanded={rowDetail.panelOpen}
          onclick={rowDetail.toggle}
        >
          {message(rowDetail.panelOpen ? 'collection.hideDetails' : 'collection.showDetails')}
        </Button>
      {/if}
      <Button
        size="icon-sm"
        class={binding.styles.arrayList?.addButton}
        disabled={addDisabled}
        onclick={addButtonClick}
        aria-label={binding.control.translations?.addAriaLabel ?? 'Add item'}
        title={binding.control.translations?.addTooltip ?? 'Add item'}
      >
        <PlusOutline class="h-4 w-4" />
      </Button>
    </div>

    <RowDetailFrame
      panel={rowDetail}
      schema={binding.control.schema}
      path={binding.control.path}
      scope={binding.control.uischema.scope}
      enabled={binding.control.enabled}
      height={binding.control.uischema.options?.layout?.height}
    >
      <!-- Table -->
      <div class="px-4 pb-4">
        <Table.Root style={columnWidths.tableStyle}>
          {#if tableColumns.length > 0 || rowDetail.options}
            <Table.Header>
              <Table.Row>
                {#each validColumnProps as prop (prop)}
                  <Table.Head
                    scope="col"
                    data-column-field={prop}
                    style={`position:relative;${columnStyle(prop)}`}
                  >
                    {title(prop)}
                    {#if showAsterisk(prop)}
                      <span
                        aria-hidden="true"
                        class={twMerge(
                          'text-destructive ms-0.5',
                          binding.styles?.control?.asterisk,
                        )}>*</span
                      >
                    {/if}
                    <TableColumnResize
                      label={title(prop)}
                      width={columnWidths.get(prop)}
                      minWidth={tableColumns.find((column) => column.field === prop)?.minWidth}
                      maxWidth={tableColumns.find((column) => column.field === prop)?.maxWidth}
                      onresizestart={columnWidths.start}
                      onresize={(width) => columnWidths.set(prop, width)}
                    />
                  </Table.Head>
                {/each}
                {#if rowDetail.options}<Table.Head></Table.Head>{/if}
                {#if binding.control.enabled}
                  <Table.Head class={twMerge('text-center', actionColClass)}></Table.Head>
                {/if}
              </Table.Row>
            </Table.Header>
          {/if}

          <Table.Body>
            {#each page.indices as index (index)}
              <Table.Row
                class={twMerge(
                  binding.styles.arrayList?.item,
                  rowDetail.visible && rowDetail.selectedIndex === index && 'bg-muted',
                )}
                aria-current={rowDetail.visible && rowDetail.selectedIndex === index
                  ? 'true'
                  : undefined}
                onpointerup={(event: PointerEvent) => {
                  if (
                    rowPanel &&
                    event.button === 0 &&
                    !(event.target as Element).closest('button, a, [role="button"]')
                  )
                    rowDetail.select(index);
                }}
              >
                {#each validColumnProps as propName (propName)}
                  <Table.Cell style={columnStyle(propName)} class="overflow-hidden px-4 py-2">
                    <DispatchCell
                      schema={resolveCellSchema(propName)}
                      uischema={resolveUiSchema(propName)}
                      path={composePaths(
                        composePaths(binding.control.path, `${index}`),
                        wholeRow(propName) ? '' : propName,
                      )}
                      enabled={binding.control.enabled}
                      renderers={binding.control.renderers}
                      cells={binding.control.cells}
                    />
                  </Table.Cell>
                {/each}

                {#if rowDialog}
                  <Table.Cell class="px-4 py-2">
                    <RowDetailDialog
                      Dialog={DetailDialog}
                      schema={binding.control.schema}
                      path={composePaths(binding.control.path, `${index}`)}
                      scope={binding.control.uischema.scope}
                      options={rowDialog}
                      enabled={binding.control.enabled}
                      {index}
                      prepare={page.prepare}
                    />
                  </Table.Cell>
                {:else if rowPanel}
                  <Table.Cell class="px-4 py-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onclick={() => rowDetail.select(index, true)}
                      >{message('collection.editRowDetails', { index: index + 1 })}</Button
                    >
                  </Table.Cell>
                {/if}
                {#if binding.control.enabled}
                  <Table.Cell class={twMerge('px-4 py-2 text-center', actionColClass)}>
                    <div class="flex items-center justify-center gap-1">
                      {#if binding.appliedOptions.showSortButtons}
                        <Button
                          variant="outline"
                          size="icon-xs"
                          class={twMerge(binding.styles.arrayList?.itemMoveUp)}
                          disabled={index <= 0 || !binding.control.enabled}
                          onclick={(e: MouseEvent) => moveUpClick(e, index)}
                          aria-label={binding.control.translations?.upAriaLabel ?? 'Move up'}
                          title={binding.control.translations?.up ?? 'Move up'}
                        >
                          <ChevronUpOutline class="h-3 w-3" />
                        </Button>

                        <Button
                          variant="outline"
                          size="icon-xs"
                          class={twMerge(binding.styles.arrayList?.itemMoveDown)}
                          disabled={index >= dataLength - 1 || !binding.control.enabled}
                          onclick={(e: MouseEvent) => moveDownClick(e, index)}
                          aria-label={binding.control.translations?.downAriaLabel ?? 'Move down'}
                          title={binding.control.translations?.down ?? 'Move down'}
                        >
                          <ChevronDownOutline class="h-3 w-3" />
                        </Button>
                      {/if}

                      <Button
                        variant="destructive"
                        size="icon-xs"
                        class={twMerge(binding.styles.arrayList?.itemDelete)}
                        disabled={isDeleteDisabled()}
                        onclick={(e: MouseEvent) => removeItemsClick(e, [index])}
                        aria-label={binding.control.translations?.removeAriaLabel ?? 'Delete item'}
                        title={binding.control.translations?.removeTooltip ?? 'Delete'}
                      >
                        <TrashBinOutline class="h-3 w-3" />
                      </Button>
                    </div>
                  </Table.Cell>
                {/if}
              </Table.Row>
            {/each}

            {#if dataLength === 0}
              <Table.Row>
                <Table.Cell
                  class="px-4 py-2 text-center"
                  colspan={validColumnProps.length +
                    (rowDetail.options ? 1 : 0) +
                    (binding.control.enabled ? 1 : 0)}
                >
                  <p class={twMerge('text-center', binding.styles.arrayList?.noData)}>
                    {binding.control.translations?.noDataMessage ?? 'No data'}
                  </p>
                </Table.Cell>
              </Table.Row>
            {/if}
          </Table.Body>
        </Table.Root>
      </div>
      <CollectionPager {page} />
    </RowDetailFrame>
  </Card.Root>
{/if}

{#if deletion.pending && binding.control.visible}
  <ConfirmationDialog
    operation="delete"
    onAccept={() => deletion.accept()}
    onCancel={() => deletion.cancel()}
  />
{/if}
