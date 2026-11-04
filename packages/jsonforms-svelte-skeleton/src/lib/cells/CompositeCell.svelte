<script lang="ts">
  import ConfirmationDialog from '../complex/components/ConfirmationDialog.svelte';
  import { Tooltip, Portal } from '@skeletonlabs/skeleton-svelte';
  import { onMount } from 'svelte';
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
    useErrorSummary,
    summaryErrorsAt,
    dataPathSegments,
    mergeRendererOptions,
  } from '@chobantonov/jsonforms-svelte';
  import { getI18nKey, type ControlElement, type UISchemaElement } from '@jsonforms/core';
  import { getIsDynamicProperty, getPortalRootNodeGetter, getPortalTargetResolver } from '../util';
  import DetailDialog from '../components/DetailDialog.svelte';
  import CellContent from './CellContent.svelte';
  const props: ControlProps = $props();
  const binding = useJsonFormsCell(props);
  const cellSegments = $derived(props.pathSegments ?? dataPathSegments(props.path));
  const jsonforms = useJsonForms();
  const message = useRendererMessages();
  const getRootNode = getPortalRootNodeGetter();
  const resolvePortalTarget = getPortalTargetResolver();
  let removeFocused = $state(false);
  let removeHovered = $state(false);
  let removeDismissed = $state(false);
  const removeTooltipOpen = $derived((removeFocused || removeHovered) && !removeDismissed);
  const dismissRemoveTooltip = (event: KeyboardEvent) => {
    if (event.key === 'Escape') removeDismissed = true;
  };
  onMount(() => () => window.removeEventListener('keydown', dismissRemoveTooltip, true));
  const clearActions = useCompositeActions(
    binding,
    getIsDynamicProperty(false),
    () => cellSegments,
  );
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
</script>

<CellContent {errors}>
  <div class="composite-cell" data-composite-cell>
    {#if showTypeIndicator}
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
          confirmationCatalogId="compositeCell"
          {label}
          title={binding.cell.schema.title !== undefined
            ? label
            : message('composite.detailsTitle')}
          enabled={clearActions.enabled}
          path={binding.cell.path}
          schema={binding.cell.schema}
          options={mergeRendererOptions(
            binding.cell.config,
            props.uischema.options,
            rowBoundLabel
              ? { disableRemove: true, showRemoveButton: false, showEmptyButton: false }
              : {},
          )}
          dialogOptions={{
            ...props.uischema.options,
            ...(rowBoundLabel ? { showRemoveButton: false, showEmptyButton: false } : {}),
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
        <Tooltip
          open={removeTooltipOpen}
          openDelay={0}
          {getRootNode}
          positioning={{ placement: 'top', strategy: 'fixed' }}
        >
          <Tooltip.Trigger>
            {#snippet element(triggerProps)}
              <button
                {...triggerProps}
                type="button"
                class="composite-clear"
                disabled={!clearActions.canRemove}
                aria-label={message('composite.removeLabel', { label })}
                title={message('composite.remove')}
                onclick={() => clearActions.remove()}
                onfocus={() => {
                  removeFocused = true;
                  removeDismissed = false;
                  window.addEventListener('keydown', dismissRemoveTooltip, true);
                }}
                onblur={() => {
                  removeFocused = false;
                  window.removeEventListener('keydown', dismissRemoveTooltip, true);
                }}
                onpointerenter={() => {
                  removeHovered = true;
                  removeDismissed = false;
                }}
                onpointerleave={() => (removeHovered = false)}
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
            {/snippet}
          </Tooltip.Trigger>
          <Portal target={resolvePortalTarget() ?? undefined}>
            <Tooltip.Context>
              {#snippet children(tooltip)}
                <div {...tooltip().getPositionerProps()}>
                  <Tooltip.Content
                    class="card preset-filled-surface-950-50 px-3 py-2 text-sm shadow-xl"
                    >{message('composite.remove')}</Tooltip.Content
                  >
                </div>
              {/snippet}
            </Tooltip.Context>
          </Portal>
        </Tooltip>
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
    opacity: 0;
    pointer-events: none;
  }
  .composite-cell:hover .composite-actions,
  .composite-cell:focus-within .composite-actions {
    opacity: 1;
    pointer-events: auto;
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
    .composite-actions {
      opacity: 1;
      pointer-events: auto;
    }
    .composite-clear {
      opacity: 1;
    }
  }
</style>
