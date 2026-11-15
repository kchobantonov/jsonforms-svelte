<script lang="ts">
  import { useRendererMessages } from '../rendererMessages.svelte';
  import { formatErrorSummary, summaryErrorsAt } from '../errorSummary';
  import { dataPathSegments } from '../dataPath';
  import { compositeSummaryPresentation } from '../compositeSummary';
  import { resolveEditorDetail } from '../detail';
  import { getContext, setContext, untrack } from 'svelte';
  import {
    Resolve,
    UPDATE_DATA,
    setDataAt,
    unsetDataAt,
    update,
    Paths,
    defaultErrorTranslator,
    defaultTranslator,
    getI18nKey,
    type CoreActions,
    type ControlElement,
    type JsonSchema,
    type UISchemaElement,
    type UpdateAction,
  } from '@jsonforms/core';
  import cloneDeep from 'lodash/cloneDeep';
  import { DispatchContextSymbol } from '../types';
  import { useDispatch, useJsonForms, useTranslator } from '../jsonFormsCompositions.svelte';
  import {
    tupleEmptyValue,
    tupleInitialValue,
    tupleRenderSchema,
    type TupleSchema,
  } from '../tuple';
  import { TuplePresentationSymbol, type TuplePresentation } from '../tuplePresentation';
  import DispatchRenderer from './DispatchRenderer.svelte';

  let {
    schema,
    prefix,
    index,
    arrayPath,
    arrayPathSegments,
    rootSchema,
    uischema,
    enabled,
    complex = false,
    options = {},
    localOptions = {},
  }: {
    schema: TupleSchema;
    prefix: TupleSchema[];
    index: number;
    arrayPath: string;
    arrayPathSegments?: readonly string[];
    rootSchema: JsonSchema;
    uischema: UISchemaElement;
    enabled: boolean;
    complex?: boolean;
    options?: Record<string, unknown>;
    localOptions?: Record<string, unknown>;
  } = $props();
  const dispatch = useDispatch();
  const jsonforms = useJsonForms();
  const t = useTranslator();
  const messageFor = useRendererMessages();
  const path = $derived(Paths.compose(arrayPath, String(index)));
  let message = $state<string | undefined>();
  let pending = $state.raw<UpdateAction | undefined>();
  const { Dialog } = getContext<TuplePresentation>(TuplePresentationSymbol);
  const data = $derived(
    arrayPath ? Resolve.data(jsonforms.core?.data, arrayPath) : jsonforms.core?.data,
  );
  const value = $derived(Array.isArray(data) ? data[index] : undefined);
  const label = $derived(
    t.value(
      getI18nKey(tupleRenderSchema(schema), uischema, path, 'label'),
      String(
        (uischema as UISchemaElement & { label?: string }).label ??
          messageFor('composite.detailsLabel'),
      ),
    ),
  );

  // A registry entry may describe a position Control with separate summary/detail,
  // or remain a legacy layout used directly as the dialog detail.
  const detail = $derived(
    resolveEditorDetail(
      uischema.options?.detail,
      jsonforms.uischemas ?? [],
      tupleRenderSchema(schema),
      '#',
      path,
      rootSchema,
      uischema,
    ),
  );
  const summary = $derived.by(() => {
    const presentation = compositeSummaryPresentation(
      value,
      uischema.options?.summary as ControlElement | undefined,
      tupleRenderSchema(schema).title,
      t.value,
      messageFor,
      tupleRenderSchema(schema),
    );
    // Tuple object positions have a specific fallback: a title or an unusable
    // summary scope is not a preview of the current value.
    return value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      presentation.generated
      ? { text: messageFor('composite.summary.details'), generated: true }
      : presentation;
  });

  const actionOptions = $derived({ ...options, ...uischema.options });
  const ownLabel = $derived(
    complex ||
      schema === false ||
      !tupleRenderSchema(schema).type ||
      Array.isArray(tupleRenderSchema(schema).type),
  );

  const errors = $derived(
    summaryErrorsAt(jsonforms.core, [
      ...(arrayPathSegments ?? dataPathSegments(arrayPath)),
      String(index),
    ]),
  );
  const errorText = $derived(
    formatErrorSummary(
      errors,
      jsonforms.core?.schema,
      jsonforms.core?.uischema,
      t.value ?? defaultTranslator,
      jsonforms.i18n?.translateError ?? defaultErrorTranslator,
    )
      .map((entry) => entry.message)
      .join('; '),
  );
  function intercept(action: CoreActions) {
    if (
      action.type !== UPDATE_DATA ||
      !(action.path === path || action.path.startsWith(path + '.'))
    ) {
      dispatch(action);
      return;
    }
    if (!enabled) return;
    const source = Array.isArray(data) ? cloneDeep(data) : [];
    const relative = action.path === path ? '' : action.path.slice(path.length + 1);
    let next = action.updater(
      cloneDeep(relative ? Resolve.data(source[index], relative) : source[index]),
    );
    if (!relative && next === undefined) next = tupleEmptyValue(schema, rootSchema);
    if (!relative && next === undefined) {
      pending = undefined;
      message = messageFor('tuple.valueRequired');
      return;
    }
    let filledPrefix = false;
    for (let i = 0; i < index; i++) {
      if (Object.hasOwn(source, i) && source[i] !== undefined) continue;
      const initial = tupleInitialValue(prefix[i] ?? true, rootSchema);
      if (initial === undefined) {
        pending = action;
        message = messageFor('tuple.missingPosition', {
          position: i + 1,
        });
        return;
      }
      source[i] = initial;
      filledPrefix = true;
    }
    if (relative) {
      if (source[index] === undefined) {
        source[index] = tupleInitialValue(schema, rootSchema);
        if (source[index] === undefined) source[index] = /^\d+(\.|$)/.test(relative) ? [] : {};
      }
      if (next === undefined) source[index] = unsetDataAt(source[index], relative);
      else
        source[index] = setDataAt(
          source[index],
          relative,
          next,
          typeof schema === 'object' ? schema : undefined,
        );
    } else source[index] = next;
    pending = undefined;
    message = undefined;
    if (Array.isArray(data) && index < data.length && !filledPrefix) {
      // Retain the containing occurrence and any nested command evidence.
      dispatch(update(action.path, () => next, action.context));
    } else {
      dispatch(
        update(
          arrayPath,
          () => source,
          Array.isArray(data) ? { type: 'ADD', values: source.slice(data.length) } : undefined,
        ),
      );
    }
  }
  setContext(DispatchContextSymbol, intercept);
  $effect(() => {
    void data;
    untrack(() => {
      if (pending) intercept(pending);
    });
  });
</script>

<fieldset class="tuple-field">
  {#if ownLabel}<legend>{label}</legend>{/if}
  {#if schema === false}
    <p role="alert">{messageFor('tuple.forbidden')}</p>
  {:else if complex}
    <div class="tuple-complex-value">
      <span class="tuple-summary" class:generated={summary.generated}>{summary.text}</span>
      <Dialog
        inspectable
        {label}
        {enabled}
        {path}
        schema={tupleRenderSchema(schema)}
        options={actionOptions}
        dialogOptions={{ ...localOptions, ...uischema.options }}
      >
        <DispatchRenderer
          schema={tupleRenderSchema(schema)}
          uischema={detail}
          {path}
          {rootSchema}
          {enabled}
        />
        {#if message}<p role="alert">{message}</p>{/if}
      </Dialog>
    </div>
    {#if errorText}<p role="alert">{errorText}</p>{/if}
  {:else}
    <DispatchRenderer
      schema={tupleRenderSchema(schema)}
      uischema={ownLabel ? ({ ...uischema, label: false } as ControlElement) : uischema}
      {path}
      {rootSchema}
      {enabled}
    />
  {/if}
  {#if message}<p role="alert">{message}</p>{/if}
</fieldset>

<style>
  .tuple-field {
    min-width: 0;
    flex: 1 1 auto;
    border: 0;
    padding: 0;
    margin: 0;
  }
  legend {
    display: block;
    width: 100%;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
  }
  .tuple-complex-value {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 2.5rem;
  }
  .tuple-summary.generated {
    opacity: 0.65;
    font-style: italic;
  }
  .tuple-summary {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
    user-select: text;
  }
</style>
