<script lang="ts">
  import { useRendererMessages } from '../rendererMessages.svelte';
  import { findDetailUISchema } from '../detail';
  import {
    composePaths,
    getI18nKey,
    type ControlElement,
    type UISchemaElement,
  } from '@jsonforms/core';
  import {
    useJsonFormsControlWithDetail,
    useJsonForms,
    useTranslator,
    type ControlProps,
  } from '../jsonFormsCompositions.svelte';
  import {
    tupleDefinition,
    resolveTupleSchema,
    tupleRenderSchema,
    type TupleSchema,
  } from '../tuple';
  import { getContext } from 'svelte';
  import { TuplePresentationSymbol, type TuplePresentation } from '../tuplePresentation';
  const { AdditionalItems } = getContext<TuplePresentation>(TuplePresentationSymbol);
  import TupleField from './TupleField.svelte';
  import TuplePositionLayout from './TuplePositionLayout.svelte';
  import { tuplePlacedPositions } from '../tuplePositionLayout';
  import { labelSummaryErrorMessage } from '../labelSummaryErrors';
  let props: ControlProps = $props();
  const binding = useJsonFormsControlWithDetail(props);
  const message = useRendererMessages();
  const jsonforms = useJsonForms();
  const translator = useTranslator();
  const control = $derived(binding.control);
  const options = $derived({
    ...control.config,
    ...control.uischema.options,
    vertical:
      control.uischema.options?.vertical ??
      control.config?.jsonformsExtended?.tuple?.vertical ??
      false,
  });
  const definition = $derived(tupleDefinition(control.schema, options.variant === 'tuple'));
  const data = $derived(Array.isArray(control.data) ? control.data : []);
  const enabled = $derived(control.enabled && !control.readonly);
  function fieldSchema(index: number): TupleSchema {
    return resolveTupleSchema(
      definition?.prefix[index] ?? (definition?.tail === false ? true : (definition?.tail ?? true)),
      control.rootSchema,
    );
  }
  const layout = $derived(
    options.detail && typeof options.detail === 'object' && typeof options.detail.type === 'string'
      ? (options.detail as UISchemaElement)
      : undefined,
  );
  function fieldUI(index: number, authored?: ControlElement): UISchemaElement {
    const schema = tupleRenderSchema(fieldSchema(index));
    const label = schema.title ?? message('tuple.position', { position: index + 1 });
    let ui: UISchemaElement = { type: 'Control', scope: '#', label } as ControlElement;
    if (schema.type === 'object' || schema.type === 'array') {
      const registered = findDetailUISchema(
        control.uischemas,
        schema,
        '#',
        control.path + '.' + index,
        () => ({ type: 'Control', scope: '#', label }) as ControlElement,
        typeof options.detail === 'string'
          ? ({ type: 'Control', scope: '#', options: { detail: options.detail } } as ControlElement)
          : undefined,
        control.rootSchema,
      );
      ui =
        registered.type === 'Control'
          ? registered
          : ({ type: 'Control', scope: '#', options: { detail: registered } } as ControlElement);
    }
    return {
      ...ui,
      ...authored,
      type: 'Control',
      scope: '#',
      rule: undefined,
      label: authored?.label ?? (ui as ControlElement).label ?? label,
      options: { ...ui.options, ...authored?.options },
    } as ControlElement;
  }
  const omittedErrors = $derived.by(() => {
    if (!layout || !definition) return [];
    const placed = tuplePlacedPositions(layout, definition.prefix.length);
    return definition.prefix.flatMap((_, index) => {
      if (placed.has(index)) return [];
      const schema = tupleRenderSchema(fieldSchema(index));
      const ui = fieldUI(index) as ControlElement;
      const path = composePaths(control.path, String(index));
      const errors = labelSummaryErrorMessage({ jsonforms }, schema, ui, path, {
        type: 'Control',
        scope: '#',
      });
      if (!errors) return [];
      const fallback =
        typeof ui.label === 'string'
          ? ui.label
          : message('tuple.position', { position: index + 1 });
      const label = translator.value(getI18nKey(schema, ui, path, 'label'), fallback);
      return [{ index, text: message('tuple.positionError', { label, error: errors }) }];
    });
  });
  function complex(index: number) {
    const schema = fieldSchema(index);
    return typeof schema === 'object' && (schema.type === 'object' || schema.type === 'array');
  }
</script>

{#if !definition}
  <p role="alert">
    {message('tuple.configuration')}
  </p>
{:else}
  {#if layout}
    <TuplePositionLayout
      schema={control.schema}
      uischema={layout}
      path={control.path}
      rootSchema={control.rootSchema}
      {enabled}
      renderers={control.renderers}
      cells={control.cells}
      count={definition.prefix.length}
    >
      {#snippet renderPosition(index: number, authored: ControlElement, positionEnabled: boolean)}
        <TupleField
          schema={fieldSchema(index)}
          prefix={definition!.prefix}
          {index}
          arrayPath={control.path}
          rootSchema={control.rootSchema}
          uischema={fieldUI(index, authored)}
          enabled={enabled && positionEnabled}
          {options}
          complex={complex(index)}
        />
      {/snippet}
    </TuplePositionLayout>
    {#if omittedErrors.length}
      <ul data-tuple-omitted-errors aria-label={message('tuple.omittedErrors')}>
        {#each omittedErrors.slice(0, 5) as error (error.index)}<li role="alert">
            {error.text}
          </li>{/each}
      </ul>
      {#if omittedErrors.length > 5}
        <details>
          <summary
            >{message('tuple.morePositionErrors', { count: omittedErrors.length - 5 })}</summary
          >
          <ul>
            {#each omittedErrors.slice(5) as error (error.index)}<li>{error.text}</li>{/each}
          </ul>
        </details>
      {/if}
    {/if}
  {:else}
    <div class="tuple-fields" class:vertical={options.vertical === true}>
      <!-- Tuple editors retain their positional identity when schemas are replaced. -->
      {#each definition.prefix.keys() as index (index)}
        <TupleField
          schema={fieldSchema(index)}
          prefix={definition.prefix}
          {index}
          arrayPath={control.path}
          rootSchema={control.rootSchema}
          uischema={fieldUI(index)}
          {enabled}
          {options}
          complex={complex(index)}
        />
      {/each}
    </div>
  {/if}
  {#if definition.tail !== false || data.length > definition.prefix.length}
    <AdditionalItems {binding} {definition}>
      {#snippet renderItem(index: number)}
        <TupleField
          schema={fieldSchema(index)}
          prefix={definition.prefix}
          {index}
          arrayPath={control.path}
          rootSchema={control.rootSchema}
          uischema={fieldUI(index)}
          {enabled}
          {options}
          complex={complex(index)}
        />
      {/snippet}
    </AdditionalItems>
  {/if}
{/if}

<style>
  .tuple-fields {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }
  .tuple-fields:not(.vertical) > :global(.tuple-field) {
    flex-basis: 12rem;
  }
  .tuple-fields.vertical {
    flex-direction: column;
  }
</style>
