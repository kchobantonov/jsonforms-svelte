<script lang="ts">
  import { getContext, setContext, untrack } from 'svelte';
  import {
    UPDATE_DATA,
    setDataAt,
    unsetDataAt,
    update,
    Paths,
    Resolve,
    getI18nKey,
    type CoreActions,
    type ControlElement,
    type JsonSchema,
    type UISchemaElement,
    type UpdateAction,
  } from '@jsonforms/core';
  import cloneDeep from 'lodash/cloneDeep';
  import get from 'lodash/get';
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
    rootSchema,
    uischema,
    enabled,
    complex = false,
    options = {},
  }: {
    schema: TupleSchema;
    prefix: TupleSchema[];
    index: number;
    arrayPath: string;
    rootSchema: JsonSchema;
    uischema: UISchemaElement;
    enabled: boolean;
    complex?: boolean;
    options?: Record<string, any>;
  } = $props();
  const dispatch = useDispatch();
  const jsonforms = useJsonForms();
  const t = useTranslator();
  const path = $derived(Paths.compose(arrayPath, String(index)));
  let message = $state<string | undefined>();
  let pending = $state.raw<UpdateAction | undefined>();
  const { Dialog } = getContext<TuplePresentation>(TuplePresentationSymbol);
  const data = $derived(
    arrayPath ? get(jsonforms.core?.data, arrayPath.split('.')) : jsonforms.core?.data,
  );
  const value = $derived(Array.isArray(data) ? data[index] : undefined);
  const label = $derived(
    t.value(
      getI18nKey(tupleRenderSchema(schema), uischema, path, 'label'),
      String((uischema as UISchemaElement & { label?: string }).label ?? 'details'),
    ),
  );

  // A registry entry may describe a position Control with separate summary/detail,
  // or remain a legacy layout used directly as the dialog detail.
  const detail = $derived(
    typeof uischema.options?.detail === 'object' && uischema.options.detail !== null
      ? (uischema.options.detail as UISchemaElement)
      : uischema,
  );
  const summary = $derived.by(() => {
    const descriptor = uischema.options?.summary as ControlElement | undefined;
    if (value == null) return t.value('composite.summary.unset', 'Not set');
    if (Array.isArray(value)) {
      if (descriptor?.scope && value.length) {
        const preview: string[] = [];
        for (const item of value) {
          const entry = Resolve.data(item, Paths.fromScoped(descriptor));
          if (entry != null && typeof entry !== 'object' && String(entry).trim()) {
            preview.push(String(entry));
            if (preview.length === 2) break;
          }
        }
        if (preview.length) {
          const remaining = value.length - preview.length;
          return (
            preview.join(', ') +
            (remaining
              ? ' ' +
                t.value('composite.summary.more', '(+' + remaining + ' more)', { count: remaining })
              : '')
          );
        }
      }
      return t.value(
        value.length === 1 ? 'composite.summary.item' : 'composite.summary.items',
        value.length + (value.length === 1 ? ' item' : ' items'),
        { count: value.length },
      );
    }
    const entry = descriptor?.scope ? Resolve.data(value, Paths.fromScoped(descriptor)) : undefined;
    return entry != null && typeof entry !== 'object'
      ? String(entry)
      : t.value('composite.summary.details', 'View details');
  });

  const actionOptions = $derived({ ...options, ...uischema.options });
  const ownLabel = $derived(
    complex ||
      schema === false ||
      !tupleRenderSchema(schema).type ||
      Array.isArray(tupleRenderSchema(schema).type),
  );

  const errors = $derived(
    [...(jsonforms.core?.errors ?? []), ...(jsonforms.core?.additionalErrors ?? [])].filter(
      (error) => {
        const pointer =
          '/' +
          path
            .split('.')
            .map((part) => part.replace(/~/g, '~0').replace(/\//g, '~1'))
            .join('/');
        return error.instancePath === pointer || error.instancePath.startsWith(pointer + '/');
      },
    ),
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
      cloneDeep(relative ? get(source[index], relative.split('.')) : source[index]),
    );
    if (!relative && next === undefined) next = tupleEmptyValue(schema, rootSchema);
    if (!relative && next === undefined) {
      pending = undefined;
      message = t.value('tuple.valueRequired', 'Enter a value for this position.');
      return;
    }
    for (let i = source.length; i < index; i++) {
      const initial = tupleInitialValue(prefix[i] ?? true, rootSchema);
      if (initial === undefined) {
        pending = action;
        message = t.value('tuple.missingPosition', 'Enter Item ' + (i + 1) + ' first.', {
          position: i + 1,
        });
        return;
      }
      source.push(initial);
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
    dispatch(update(arrayPath, () => source));
  }
  setContext(DispatchContextSymbol, intercept);
  $effect(() => {
    data;
    untrack(() => {
      if (pending) intercept(pending);
    });
  });
</script>

<fieldset class="tuple-field">
  {#if ownLabel}<legend>{label}</legend>{/if}
  {#if schema === false}
    <p role="alert">{t.value('tuple.forbidden', 'No value is permitted at this position.')}</p>
  {:else if complex}
    <div class="tuple-complex-value">
      <span class="tuple-summary">{summary}</span>
      <Dialog {label} {enabled} {path} schema={tupleRenderSchema(schema)} options={actionOptions}>
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
    {#if errors.length}<p role="alert">{errors.map((error) => error.message).join('; ')}</p>{/if}
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
  .tuple-summary {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
    user-select: text;
  }
</style>
