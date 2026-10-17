<script lang="ts">
  import ConfirmationDialog from '../complex/components/ConfirmationDialog.svelte';
  import {
    DispatchRenderer,
    type ControlProps,
    useJsonFormsCell,
    useRendererMessages,
    useTranslator,
    compositeSummaryPresentation,
    labelSummaryErrorMessage,
    useCompositeActions,
    useJsonForms,
    resolveEditorDetail,
  } from '@chobantonov/jsonforms-svelte';
  import { getI18nKey, type ControlElement, type UISchemaElement } from '@jsonforms/core';
  import { getIsDynamicProperty } from '../util';
  import DetailDialog from '../components/DetailDialog.svelte';
  import CellContent from './CellContent.svelte';
  const props: ControlProps = $props();
  const binding = useJsonFormsCell(props);
  const jsonforms = useJsonForms();
  const message = useRendererMessages();
  const clearActions = useCompositeActions(binding, getIsDynamicProperty(false));
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
      binding.cell.schema.title ?? message('composite.detailsLabel'),
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
  const detail = $derived(
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
  const errors = $derived(
    labelSummary
      ? labelSummaryErrorMessage(
          { jsonforms },
          binding.cell.schema,
          props.uischema,
          binding.cell.path,
          options?.detail ? detail : undefined,
        )
      : binding.cell.errors,
  );
</script>

<CellContent {errors}>
  <div class="composite-cell" data-composite-cell>
    {#if showTypeIndicator && !labelSummary}
      <span aria-hidden="true" data-composite-type
        >{Array.isArray(binding.cell.data) || binding.cell.schema.type === 'array'
          ? '[]'
          : '{}'}</span
      >
    {/if}
    <div
      class="composite-summary"
      class:generated={summary.generated && !labelSummary}
      data-composite-summary
    >
      {#if labelSummary}
        <DispatchRenderer
          schema={binding.cell.schema}
          uischema={labelSummary}
          path={binding.cell.path}
          enabled={false}
          renderers={binding.cell.renderers}
          cells={binding.cell.cells}
        />
      {:else}{summary.text}{/if}
    </div>
    <div class="composite-actions">
      {#if showEditor}
        <DetailDialog
          inspectable
          {label}
          enabled={clearActions.enabled}
          path={binding.cell.path}
          schema={binding.cell.schema}
          options={{
            ...binding.cell.config,
            ...props.uischema.options,
            ...(rowBoundLabel
              ? { disableRemove: true, showRemoveButton: false, showEmptyButton: false }
              : {}),
          }}
          allowRemove={clearActions.canRemove && !rowBoundLabel}
        >
          <DispatchRenderer
            schema={binding.cell.schema}
            uischema={detail}
            path={binding.cell.path}
            enabled={clearActions.enabled}
            renderers={binding.cell.renderers}
            cells={binding.cell.cells}
          />
        </DetailDialog>
      {/if}
      {#if !rowBoundLabel && clearActions.showRemove && !options?.summaryOnly && (!labelSummary || Boolean(options?.detail))}
        <button
          type="button"
          class="composite-clear"
          disabled={!clearActions.canRemove}
          aria-label={message('composite.removeLabel', { label })}
          title={message('composite.remove')}
          onclick={() => clearActions.remove()}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"><path d="m6 6 12 12M6 18 18 6" /></svg
          >
        </button>
      {/if}
    </div>
  </div>
</CellContent>

{#if clearActions.pending && binding.cell.visible}
  <ConfirmationDialog
    operation={clearActions.pending.operation}
    onAccept={clearActions.accept}
    onCancel={clearActions.cancel}
  />
{/if}

<style>
  .composite-cell {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    min-width: 0;
  }
  .composite-summary {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    user-select: text;
    cursor: text;
  }
  .composite-summary.generated {
    opacity: 0.65;
    font-style: italic;
  }
  .composite-actions {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    flex: none;
  }
  .composite-clear {
    opacity: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 0.25rem;
    cursor: pointer;
  }
  .composite-cell:hover .composite-clear,
  .composite-cell:focus-within .composite-clear {
    opacity: 1;
  }
  .composite-clear:disabled {
    cursor: not-allowed;
  }
  .composite-cell:hover .composite-clear:disabled,
  .composite-cell:focus-within .composite-clear:disabled {
    opacity: 0.4;
  }
  .composite-clear:hover:not(:disabled) {
    background: color-mix(in srgb, currentColor 10%, transparent);
  }
  .composite-clear:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }
  @media (hover: none) {
    .composite-clear {
      opacity: 1;
    }
  }
</style>
