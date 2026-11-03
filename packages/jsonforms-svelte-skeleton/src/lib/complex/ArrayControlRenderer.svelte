<script lang="ts">
  import {
    CollectionItem,
    arrayChildErrorCount,
    arrayChildNotice,
    showArraySortButtons,
  } from '@chobantonov/jsonforms-svelte';
  import { tick } from 'svelte';
  import { useCollectionAction } from '@chobantonov/jsonforms-svelte';
  import RowDetailToggle from '../components/RowDetailToggle.svelte';
  import TupleAction from '../components/TupleAction.svelte';
  import { useDeletionConfirmation } from '@chobantonov/jsonforms-svelte';
  import ConfirmationDialog from '../complex/components/ConfirmationDialog.svelte';
  import {
    DispatchCell,
    LiteralControl,
    useCollectionPagination,
    dataPathSegments,
    collectionErrorPositions,
    scopeDataSegments,
    resolveTableColumns,
    useTableColumnWidths,
    TableColumnResize,
    RowDetailDialog,
    useRowDetailPanel,
    useRendererMessages,
    useArrayPanelState,
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
  } from '@lucide/svelte';
  import startCase from 'lodash/startCase';
  import { twMerge } from 'tailwind-merge';
  import { useSkeletonArrayControl } from '../util';

  import CollectionPager from '../components/CollectionPager.svelte';
  import DetailDialog from '../components/DetailDialog.svelte';
  import RowDetailFrame from '../components/RowDetailFrame.svelte';
  import SectionIndicators from '../layouts/SectionIndicators.svelte';

  const props: RendererProps<ControlElement> = $props();
  const controlPathSegments = $derived([
    ...(props.pathSegments ?? dataPathSegments(props.path)),
    ...scopeDataSegments(props.uischema.scope),
  ]);
  const jsonforms = useJsonForms();
  const binding = useSkeletonArrayControl(useJsonFormsArrayControl(props));
  const panel = useArrayPanelState(
    () => binding.control.uischema.options,
    () => binding.control.config,
  );
  const panelContentId = $props.id();

  const showSortButtons = $derived(showArraySortButtons(binding.appliedOptions));
  const dataLength = $derived(binding.control.data ? binding.control.data.length : 0);

  const keys = $derived(Array.from({ length: dataLength }, (_, index) => index));
  const errorPositions = $derived(
    collectionErrorPositions(jsonforms.core, controlPathSegments, keys),
  );
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
      return errorPositions;
    },
    kind: 'array',
  });

  const message = useRendererMessages();
  const childErrorCount = $derived(
    arrayChildErrorCount(
      binding.control.childErrors,
      controlPathSegments,
      binding.appliedOptions.showValidationIndicatorCount === true,
    ),
  );
  const firstInvalidIndex = $derived(errorPositions[0]?.index);
  let noticeElement = $state<HTMLParagraphElement>();
  async function revealFirstError() {
    const index = firstInvalidIndex;
    if (index === undefined || !page.change(Math.floor(index / page.size) + 1)) return;
    if (panel.collapsed) panel.toggle();
    if (rowPanel) rowDetail.select(index, true);
    await tick();
    const row = noticeElement?.parentElement?.querySelector<HTMLElement>(
      `[data-array-row-index="${index}"]`,
    );
    row?.scrollIntoView({ block: 'center' });
    if (rowDialog) {
      const label = message('collection.editRowDetails', { index: index + 1 });
      const trigger = [...(row?.querySelectorAll<HTMLButtonElement>('button') ?? [])].find(
        (button) => button.getAttribute('aria-label') === label,
      );
      if (trigger) {
        trigger.click();
        return;
      }
    }
    row?.focus({ preventScroll: true });
  }
  const rowDetail = useRowDetailPanel({
    options: () => binding.control.uischema.options?.rowDetail,
    rows: () => binding.control.data,
    keys: () => binding.control.rowKeys,
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
  const actionColClass = $derived(showSortButtons ? 'w-[150px]' : 'w-[50px]');

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
      binding.control.schema.properties && !wholeRow(propName)
        ? `#/properties/${propName.replaceAll('~', '~0').replaceAll('/', '~1')}`
        : '#';
    return {
      type: 'Control',
      scope,
      label: false,
      options: binding.control.uischema.options?.cells?.[propName],
    };
  }

  function resolveCellSchema(propName: string): JsonSchema {
    if (wholeRow(propName)) return binding.control.schema;
    if (propName === '' && Object.hasOwn(binding.control.schema.properties ?? {}, ''))
      return binding.control.schema.properties![''];
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

  const runCollectionAction = useCollectionAction(() => binding.control, page.prepare);

  function addButtonClick() {
    void runCollectionAction(
      () => !addDisabled,
      () => {
        binding.addItem(
          binding.control.path,
          createDefaultValue(binding.control.schema, binding.control.rootSchema),
        )();
      },
    );
  }

  function move(event: Event, from: number, direction: -1 | 1) {
    event.stopPropagation();
    const to = from + direction;
    void runCollectionAction(
      () =>
        !!showSortButtons &&
        Number.isInteger(from) &&
        from >= 0 &&
        from < dataLength &&
        to >= 0 &&
        to < dataLength,
      () => {
        const action = direction === -1 ? binding.moveUp : binding.moveDown;
        action?.(binding.control.path, from)();
      },
    );
  }
  function moveUpClick(event: Event, index: number) {
    move(event, index, -1);
  }
  function moveDownClick(event: Event, index: number) {
    move(event, index, 1);
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

  function isDeleteDisabled(): boolean | undefined {
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
    const skeletonProps = binding.skeletonProps('card');
    return {
      ...skeletonProps,
      class: twMerge(
        'card preset-outlined-surface-200-800 mt-1 mb-1 min-w-full',
        binding.styles.arrayList.root,
        skeletonProps.class,
      ),
    };
  });
</script>

{#if binding.control.visible}
  {#if binding.control.errors}
    <p role="alert" data-array-own-errors class="text-error-600 dark:text-error-400 my-2 text-sm">
      {binding.control.errors}
    </p>
  {/if}
  {#if childErrorCount > 0 && !binding.appliedOptions.hideArraySummaryValidation && binding.appliedOptions.showValidationIndicator !== false && binding.appliedOptions.showValidationIndicator !== true}
    <p
      bind:this={noticeElement}
      role="alert"
      data-array-summary
      class="text-error-600 dark:text-error-400 my-2 text-sm"
    >
      <span data-array-summary-message
        >{arrayChildNotice(
          childErrorCount,
          binding.appliedOptions.showValidationIndicatorCount === true,
          message,
        )}</span
      >
      {#if firstInvalidIndex !== undefined}
        <button type="button" class="ms-2 underline" onclick={revealFirstError}
          >{message('collection.firstError')}</button
        >
      {/if}
    </p>
  {/if}
  <section {...cardProps}>
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
        {#if !binding.appliedOptions.hideArraySummaryValidation && binding.appliedOptions.showValidationIndicator === true}
          <SectionIndicators
            uischema={binding.control.uischema}
            path={props.path}
            pathSegments={props.pathSegments}
            showData={false}
          />
        {/if}
      </div>

      <div class="flex items-center gap-2" data-array-actions>
        {#if panel.collapsible}
          <button
            type="button"
            class="btn btn-sm preset-tonal"
            data-array-panel-toggle
            aria-label={message(panel.collapsed ? 'tree.expand' : 'tree.collapse', {
              label: binding.computedLabel,
            })}
            aria-expanded={!panel.collapsed}
            aria-controls={panelContentId}
            onclick={panel.toggle}
          >
            {#if panel.collapsed}<ChevronDownOutline class="h-4 w-4" />{:else}<ChevronUpOutline
                class="h-4 w-4"
              />{/if}
          </button>
        {/if}
        {#if rowPanel}
          <RowDetailToggle
            open={rowDetail.panelOpen}
            disabled={false}
            onclick={rowDetail.toggle}
            label={message(
              rowDetail.panelOpen ? 'collection.hideDetails' : 'collection.showDetails',
            )}
          />
        {/if}
        <TupleAction
          kind="add"
          label={binding.control.translations?.addTooltip ?? message('array.addTooltip')}
          ariaLabel={binding.control.translations?.addAriaLabel ?? message('array.addAriaLabel')}
          buttonClass={twMerge('btn btn-sm preset-filled', binding.styles.arrayList?.addButton)}
          disabled={addDisabled}
          onclick={addButtonClick}
        >
          {#snippet icon()}<PlusOutline class="h-4 w-4" />{/snippet}
        </TupleAction>
      </div>
    </div>

    <div id={panelContentId} hidden={panel.collapsed}>
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
          <div class="w-full overflow-x-auto">
            <table class="table w-full" style={columnWidths.tableStyle}>
              {#if tableColumns.length > 0 || rowDetail.options}
                <thead>
                  <tr>
                    {#each validColumnProps as prop (prop)}
                      <th
                        scope="col"
                        data-column-field={prop}
                        style={`position:relative;${columnStyle(prop)}`}
                      >
                        {title(prop)}
                        {#if showAsterisk(prop)}
                          <span
                            aria-hidden="true"
                            class={twMerge(
                              'text-error-500 dark:text-error-400 ms-0.5',
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
                      </th>
                    {/each}
                    {#if rowDetail.options}<th></th>{/if}
                    {#if binding.control.enabled}
                      <th class={twMerge('text-center', actionColClass)}></th>
                    {/if}
                  </tr>
                </thead>
              {/if}

              <tbody>
                {#each page.indices as index (binding.control.rowKeys[index])}
                  <CollectionItem
                    identity={binding.control.rowKeys[index]}
                    path={composePaths(binding.control.path, `${index}`)}
                    sourceItem={binding.control.data[index]}
                  >
                    <tr
                      data-array-row-index={index}
                      tabindex={-1}
                      class={twMerge(
                        binding.styles.arrayList?.item,
                        rowDetail.visible &&
                          rowDetail.selectedIndex === index &&
                          'preset-tonal-primary',
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
                        <td style={columnStyle(propName)} class="overflow-hidden px-4 py-2">
                          {#if !wholeRow(propName) && (propName === '' || propName.includes('.') || propName.includes('\0') || ['__proto__', 'constructor', 'prototype'].includes(propName))}
                            <LiteralControl
                              schema={binding.control.schema}
                              uischema={resolveUiSchema(propName)}
                              path={composePaths(binding.control.path, `${index}`)}
                              enabled={binding.control.enabled}
                              renderers={binding.control.renderers}
                              cells={binding.control.cells}
                              cellMode
                            />
                          {:else}
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
                          {/if}
                        </td>
                      {/each}

                      {#if rowDialog}
                        <td class="px-4 py-2">
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
                        </td>
                      {:else if rowPanel}
                        <td class="px-4 py-2">
                          <button
                            type="button"
                            class="btn btn-sm preset-outlined"
                            onclick={() => rowDetail.select(index, true)}
                            >{message('collection.editRowDetails', { index: index + 1 })}</button
                          >
                        </td>
                      {/if}
                      {#if binding.control.enabled}
                        <td class={twMerge('px-4 py-2 text-center', actionColClass)}>
                          <div class="flex items-center justify-center gap-1">
                            {#if showSortButtons}
                              <TupleAction
                                kind="add"
                                label={binding.control.translations?.up ?? message('array.up')}
                                ariaLabel={binding.control.translations?.upAriaLabel ??
                                  message('array.upAriaLabel')}
                                buttonClass={twMerge(
                                  'btn btn-sm preset-outlined',
                                  binding.styles.arrayList?.itemMoveUp,
                                )}
                                disabled={index <= 0 || !binding.control.enabled}
                                onclick={(e: MouseEvent) => moveUpClick(e, index)}
                              >
                                {#snippet icon()}<ChevronUpOutline class="h-3 w-3" />{/snippet}
                              </TupleAction>

                              <TupleAction
                                kind="add"
                                label={binding.control.translations?.down ?? message('array.down')}
                                ariaLabel={binding.control.translations?.downAriaLabel ??
                                  message('array.downAriaLabel')}
                                buttonClass={twMerge(
                                  'btn btn-sm preset-outlined',
                                  binding.styles.arrayList?.itemMoveDown,
                                )}
                                disabled={index >= dataLength - 1 || !binding.control.enabled}
                                onclick={(e: MouseEvent) => moveDownClick(e, index)}
                              >
                                {#snippet icon()}<ChevronDownOutline class="h-3 w-3" />{/snippet}
                              </TupleAction>
                            {/if}

                            <TupleAction
                              kind="delete"
                              label={binding.control.translations?.removeTooltip ??
                                message('array.removeTooltip')}
                              ariaLabel={binding.control.translations?.removeAriaLabel ??
                                message('array.removeAriaLabel')}
                              buttonClass={twMerge(
                                'btn btn-sm preset-tonal hover:preset-filled-error-500',
                                binding.styles.arrayList?.itemDelete,
                              )}
                              disabled={isDeleteDisabled()}
                              onclick={(e: MouseEvent) => removeItemsClick(e, [index])}
                            >
                              {#snippet icon()}<TrashBinOutline class="h-3 w-3" />{/snippet}
                            </TupleAction>
                          </div>
                        </td>
                      {/if}
                    </tr>
                  </CollectionItem>
                {/each}

                {#if dataLength === 0}
                  <tr>
                    <td
                      class="px-4 py-2 text-center"
                      colspan={validColumnProps.length +
                        (rowDetail.options ? 1 : 0) +
                        (binding.control.enabled ? 1 : 0)}
                    >
                      <p class={twMerge('text-center', binding.styles.arrayList?.noData)}>
                        {binding.control.translations?.noDataMessage ??
                          message('array.noDataMessage')}
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
{/if}

{#if deletion.pending && binding.control.visible}
  <ConfirmationDialog operation="delete" onAccept={deletion.accept} onCancel={deletion.cancel} />
{/if}
