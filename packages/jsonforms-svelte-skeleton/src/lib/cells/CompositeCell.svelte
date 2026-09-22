<script lang="ts">
  import {
    DispatchRenderer,
    type ControlProps,
    useJsonFormsCell,
    useTranslator,
    useCompositeActions,
  } from '@chobantonov/jsonforms-svelte';
  import { Paths, Resolve, type ControlElement, type UISchemaElement } from '@jsonforms/core';
  import { getIsDynamicProperty } from '../util';
  import DetailDialog from '../components/DetailDialog.svelte';
  import CellContent from './CellContent.svelte';
  const props: ControlProps = $props();
  const binding = useJsonFormsCell(props);
  const t = useTranslator();
  const clearActions = useCompositeActions(binding, getIsDynamicProperty(false));
  const options = $derived(
    props.uischema.options as { summary?: ControlElement; detail?: UISchemaElement } | undefined,
  );
  const summary = $derived.by(() => {
    const data = binding.cell.data;
    const descriptor = options?.summary;
    if (Array.isArray(data)) {
      if (descriptor?.scope && data.length) {
        const path = Paths.fromScoped(descriptor);
        const preview: string[] = [];
        for (const item of data) {
          const value = Resolve.data(item, path);
          if (value != null && typeof value !== 'object' && String(value).trim()) {
            preview.push(String(value));
            if (preview.length === 2) break;
          }
        }
        if (preview.length) {
          const remaining = data.length - preview.length;
          const suffix = remaining
            ? t.value('composite.summary.more', '(+' + remaining + ' more)', { count: remaining })
            : '';
          return preview.join(', ') + (suffix ? ' ' + suffix : '');
        }
      }
      return t.value(
        data.length === 1 ? 'composite.summary.item' : 'composite.summary.items',
        data.length + (data.length === 1 ? ' item' : ' items'),
        { count: data.length },
      );
    }
    const value = descriptor?.scope ? Resolve.data(data, Paths.fromScoped(descriptor)) : undefined;
    if (value != null) return String(value);
    if (data && typeof data === 'object')
      return binding.cell.schema.title ?? t.value('composite.summary.details', 'View details');
    return t.value('composite.summary.unset', 'Not set');
  });
  const detail = $derived(options?.detail ?? { type: 'Control', scope: '#', label: false });
  const label = $derived(
    binding.cell.schema.title ?? t.value('composite.summary.details', 'details'),
  );
</script>

<CellContent errors={binding.cell.errors}>
  <div class="composite-cell" data-composite-cell>
    <span class="composite-summary" data-composite-summary>{summary}</span>
    <div class="composite-actions">
      <DetailDialog
        {label}
        enabled={clearActions.enabled}
        path={binding.cell.path}
        schema={binding.cell.schema}
        options={{ ...binding.cell.config, ...props.uischema.options }}
        allowRemove={clearActions.canRemove}
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
      {#if clearActions.showRemove}
        <button
          type="button"
          class="composite-clear"
          disabled={!clearActions.canRemove}
          aria-label={t.value('composite.removeLabel', 'Remove ' + label, { label })}
          title={t.value('composite.remove', 'Remove value')}
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
