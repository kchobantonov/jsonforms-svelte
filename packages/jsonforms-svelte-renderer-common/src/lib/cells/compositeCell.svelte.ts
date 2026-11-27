import { useTranslator, useJsonForms } from '@chobantonov/jsonforms-svelte';
import { getI18nKey, type ControlElement, type UISchemaElement } from '@jsonforms/core';
import { useDynamicTreeResolver } from '../dynamic/dynamicTree.svelte';
import { useJsonFormsCell, type ControlProps } from '../core/jsonFormsCompositions.svelte';
import { dataPathSegments } from '../core/dataPath';
import { resolveEditorDetail } from '../core/detail';
import { mergeRendererOptions } from '../core/options';
import { useRendererMessages } from '../locale/rendererMessages.svelte';
import { summaryErrorsAt } from '../validation/errorSummary';
import { useErrorSummary } from '../validation/errorSummary.svelte';
import { labelSummaryErrorMessage } from '../validation/labelSummaryErrors';
import { useCompositeActions } from './compositeActions.svelte';
import { compositeSummaryPresentation } from './compositeSummary';

export function useCompositeCell(props: ControlProps, dynamicProperty: boolean) {
  const resolveTree = useDynamicTreeResolver();
  const binding = useJsonFormsCell(props);
  const cellSegments = $derived(props.pathSegments ?? dataPathSegments(props.path));
  const jsonforms = useJsonForms();
  const message = useRendererMessages();
  const clearActions = useCompositeActions(binding, dynamicProperty, () => cellSegments);
  const options = $derived(
    props.uischema.options as
      | {
          summary?: UISchemaElement;
          detail?: unknown;
          showTypeIndicator?: boolean;
          summaryOnly?: boolean;
        }
      | undefined,
  );
  const labelSummary = $derived(options?.summary?.type === 'Label' ? options.summary : undefined);
  const rowBoundLabel = $derived(Boolean(labelSummary) && props.uischema.scope === '#');
  const showEditor = $derived((!options?.summaryOnly && !labelSummary) || Boolean(options?.detail));
  const showTypeIndicator = $derived(
    options?.showTypeIndicator ?? binding.cell.config?.showTypeIndicator ?? false,
  );
  const translator = useTranslator();
  const label = $derived(
    translator.value(
      getI18nKey(binding.cell.schema, props.uischema, binding.cell.path, 'label'),
      binding.cell.schema.title ??
        message(
          binding.cell.schema.type === 'array' ? 'composite.itemsLabel' : 'composite.detailsLabel',
        ),
    ),
  );
  const summary = $derived(
    compositeSummaryPresentation(
      binding.cell.data,
      options?.summary?.type === 'Control' ? (options.summary as ControlElement) : undefined,
      label,
      translator.value,
      message,
      binding.cell.schema,
    ),
  );
  const authoredDetail = $derived(
    resolveEditorDetail(
      options?.detail,
      jsonforms.uischemas ?? [],
      binding.cell.schema,
      props.uischema.scope,
      binding.cell.path,
      jsonforms.core?.schema,
      { type: 'Control', scope: '#', label: false } as ControlElement,
    ),
  );
  const detail = $derived(resolveTree(authoredDetail, binding.cell.path, cellSegments));
  const pathErrors = useErrorSummary(() => summaryErrorsAt(jsonforms.core, cellSegments));
  const errors = $derived(
    labelSummary
      ? labelSummaryErrorMessage(
          { jsonforms },
          binding.cell.schema,
          props.uischema,
          binding.cell.path,
          options?.detail ? detail : undefined,
          cellSegments,
        )
      : pathErrors.entries
          .map((entry) => (entry.path ? `${entry.path}: ${entry.message}` : entry.message))
          .join('\n'),
  );
  const detailOptions = $derived(
    mergeRendererOptions(
      binding.cell.config,
      props.uischema.options,
      rowBoundLabel ? { disableRemove: true, showRemoveButton: false, showEmptyButton: false } : {},
    ),
  );
  const dialogOptions = $derived({
    ...props.uischema.options,
    ...(rowBoundLabel ? { showRemoveButton: false, showEmptyButton: false } : {}),
  });
  const showRemove = $derived(
    !rowBoundLabel &&
      clearActions.showRemove &&
      !options?.summaryOnly &&
      (!labelSummary || Boolean(options?.detail)),
  );
  return {
    binding,
    clearActions,
    message,
    get labelSummary() {
      return labelSummary;
    },
    get rowBoundLabel() {
      return rowBoundLabel;
    },
    get showEditor() {
      return showEditor;
    },
    get showTypeIndicator() {
      return showTypeIndicator;
    },
    get label() {
      return label;
    },
    get summary() {
      return summary;
    },
    get detail() {
      return detail;
    },
    get errors() {
      return errors;
    },
    get detailOptions() {
      return detailOptions;
    },
    get dialogOptions() {
      return dialogOptions;
    },
    get showRemove() {
      return showRemove;
    },
  };
}
