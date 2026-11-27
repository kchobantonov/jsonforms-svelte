import { useArrayCollection } from './arrayCollection.svelte';
import { mergeRowSelection } from './collectionIdentity';
import { useJsonForms } from '@chobantonov/jsonforms-svelte';
import {
  composePaths,
  getI18nKey,
  createDefaultValue,
  Resolve,
  type ControlElement,
  type JsonSchema,
} from '@jsonforms/core';
import { tick } from 'svelte';
import startCase from 'lodash/startCase';
import type { ControlProps, useJsonFormsArrayControl } from '../core/jsonFormsCompositions.svelte';
import { useRendererMessages } from '../locale/rendererMessages.svelte';
import { arrayChildErrorCount } from './arrayChildNotice';
import { showArraySortButtons } from './arraySortOptions';
import { useRowDetailPanel } from './rowDetail.svelte';
import { resolveTableColumns } from './tableColumns';
import { useTableColumnWidths } from './tableColumnWidths.svelte';

type TableBinding = ReturnType<typeof useJsonFormsArrayControl> & {
  appliedOptions: Record<string, unknown>;
  computedLabel: string;
};

export function useArrayTable(
  props: ControlProps,
  binding: TableBinding,
  notice?: () => HTMLParagraphElement | undefined,
) {
  const jsonforms = useJsonForms();
  const collection = useArrayCollection(props, binding, true);
  const { panel, page } = collection;
  const { controlPathSegments, errorPositions, dataLength, addDisabled } = $derived(collection);
  // Derived states
  const showSortButtons = $derived(showArraySortButtons(binding.appliedOptions));
  let selectedRowKeys = $state<string[]>([]);
  const selectedIndices = $derived(
    binding.control.rowKeys.flatMap((key, index) => (selectedRowKeys.includes(key) ? [index] : [])),
  );

  const message = useRendererMessages();
  const childErrorCount = $derived(
    arrayChildErrorCount(
      binding.control.childErrors,
      controlPathSegments,
      binding.appliedOptions.showValidationIndicatorCount === true,
    ),
  );
  const firstInvalidIndex = $derived(errorPositions[0]?.index);

  async function revealFirstError(getNotice = notice) {
    const index = firstInvalidIndex;
    if (index === undefined || !page.change(Math.floor(index / page.size) + 1)) return;
    if (panel.collapsed) panel.toggle();
    if (rowPanel) rowDetail.select(index, true);
    await tick();
    const row = getNotice?.()?.parentElement?.querySelector<HTMLElement>(
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

  const selectable = $derived(
    binding.control.enabled && binding.appliedOptions.disableRemove !== true,
  );
  const canDeleteSelected = $derived(
    selectable &&
      selectedIndices.length > 0 &&
      (!binding.appliedOptions.restrict ||
        dataLength - selectedIndices.length >= (binding.control.arraySchema?.minItems ?? 0)),
  );
  const pageSelected = $derived(
    page.indices.length > 0 &&
      page.indices.every((index) => selectedRowKeys.includes(binding.control.rowKeys[index])),
  );
  const pagePartiallySelected = $derived(
    !pageSelected &&
      page.indices.some((index) => selectedRowKeys.includes(binding.control.rowKeys[index])),
  );

  function selectPage(checked: boolean) {
    const visibleKeys = page.indices.map((index) => binding.control.rowKeys[index]);
    selectedRowKeys = checked
      ? mergeRowSelection(selectedRowKeys, visibleKeys)
      : selectedRowKeys.filter((key) => !visibleKeys.includes(key));
  }

  function selectRow(index: number, checked: boolean) {
    const key = binding.control.rowKeys[index];
    selectedRowKeys = checked
      ? mergeRowSelection(selectedRowKeys, [key])
      : selectedRowKeys.filter((selected) => selected !== key);
  }

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

  // Actions
  const { runCollectionAction } = collection;

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

  const { moveUpClick, moveDownClick, moveButton, moveAction } = collection.moveButtons(
    () => !!showSortButtons,
  );

  const { deletion, removeItemsClick } = collection.removal('arrayTable', (indices) => {
    binding.removeItems?.(
      binding.control.path,
      [...indices].sort((a, b) => b - a),
    )();
    selectedRowKeys = [];
  });

  function deleteSelected(event: Event) {
    if (canDeleteSelected) removeItemsClick(event, selectedIndices);
  }
  return {
    panel,
    page,
    message,
    arrayMessage: collection.arrayMessage,
    get frameProps() {
      const { schema, path, uischema, enabled } = binding.control;
      return {
        panel: rowDetail,
        schema,
        path,
        scope: uischema.scope,
        enabled,
        height: uischema.options?.layout?.height,
      };
    },
    dialogProps(index: number, options: NonNullable<typeof rowDialog>) {
      const { schema, path, uischema, enabled } = binding.control;
      return {
        schema,
        path: composePaths(path, String(index)),
        scope: uischema.scope,
        options,
        enabled,
        index,
        prepare: page.prepare,
      };
    },
    get columnCount() {
      return validColumnProps.length + 1 + Number(!!rowDetail.options) + Number(!!showSortButtons);
    },
    moveAction,
    moveButton,
    resizeAttributes(prop: string) {
      const column = tableColumns.find((column) => column.field === prop);
      return {
        label: title(prop),
        width: columnWidths.get(prop),
        minWidth: column?.minWidth,
        maxWidth: column?.maxWidth,
        onresizestart: columnWidths.start,
        onresize: (width: number) => columnWidths.set(prop, width),
      };
    },
    get pageCheckbox() {
      return {
        'aria-label': message('collection.selectPage'),
        checked: pageSelected,
        indeterminate: pagePartiallySelected,
        disabled: !selectable || page.indices.length === 0,
      };
    },
    rowCheckbox(index: number) {
      return {
        'aria-label': message('collection.selectRow', { index: index + 1 }),
        checked: selectedRowKeys.includes(binding.control.rowKeys[index]),
        disabled: !selectable,
      };
    },
    rowAttributes(index: number) {
      return {
        'aria-current':
          rowDetail.visible && rowDetail.selectedIndex === index ? ('true' as const) : undefined,
        onpointerup(event: PointerEvent) {
          if (
            rowPanel &&
            event.button === 0 &&
            !(event.target as Element).closest(
              'button, a, [role="button"], input[type="checkbox"], [role="checkbox"]',
            )
          )
            rowDetail.select(index);
        },
      };
    },
    revealFirstError,
    rowDetail,
    wholeRow,
    columnWidths,
    columnStyle,
    selectPage,
    selectRow,
    title,
    showAsterisk,
    resolveUiSchema,
    resolveCellSchema,
    addButtonClick,
    moveUpClick,
    moveDownClick,
    deletion,
    deleteSelected,
    get showSortButtons() {
      return showSortButtons;
    },
    get dataLength() {
      return dataLength;
    },
    get selectedRowKeys() {
      return selectedRowKeys;
    },
    get childErrorCount() {
      return childErrorCount;
    },
    get firstInvalidIndex() {
      return firstInvalidIndex;
    },
    get rowDialog() {
      return rowDialog;
    },
    get rowPanel() {
      return rowPanel;
    },
    get tableColumns() {
      return tableColumns;
    },
    get validColumnProps() {
      return validColumnProps;
    },
    get addDisabled() {
      return addDisabled;
    },
    get selectable() {
      return selectable;
    },
    get canDeleteSelected() {
      return canDeleteSelected;
    },
    get pageSelected() {
      return pageSelected;
    },
    get pagePartiallySelected() {
      return pagePartiallySelected;
    },
  };
}
