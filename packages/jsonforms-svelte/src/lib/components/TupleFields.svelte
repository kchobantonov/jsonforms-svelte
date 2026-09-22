<script lang="ts">
  import { findUISchema, type ControlElement, type UISchemaElement } from '@jsonforms/core';
  import {
    useJsonFormsControlWithDetail,
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
  let props: ControlProps = $props();
  const binding = useJsonFormsControlWithDetail(props);
  const t = useTranslator();
  const control = $derived(binding.control);
  const options = $derived({ ...control.config, ...control.uischema.options });
  const definition = $derived(tupleDefinition(control.schema, options.variant === 'tuple'));
  const data = $derived(Array.isArray(control.data) ? control.data : []);
  const enabled = $derived(control.enabled && !control.readonly);
  function fieldSchema(index: number): TupleSchema {
    return resolveTupleSchema(
      definition?.prefix[index] ?? (definition?.tail === false ? true : (definition?.tail ?? true)),
      control.rootSchema,
    );
  }
  function fieldUI(index: number): UISchemaElement {
    const schema = tupleRenderSchema(fieldSchema(index));
    const label =
      schema.title ?? t.value('tuple.position', 'Item ' + (index + 1), { position: index + 1 });
    if (schema.type === 'object' || schema.type === 'array') {
      const ui = findUISchema(
        control.uischemas,
        schema,
        '#',
        control.path + '.' + index,
        () => ({ type: 'Control', scope: '#', label }) as ControlElement,
        { type: 'Control', scope: '#', options: { detail: options.detail } } as ControlElement,
        control.rootSchema,
      );
      return {
        ...ui,
        label: (ui as UISchemaElement & { label?: string }).label ?? label,
      } as UISchemaElement;
    }
    return { type: 'Control', scope: '#', label };
  }
  function complex(index: number) {
    const schema = fieldSchema(index);
    return typeof schema === 'object' && (schema.type === 'object' || schema.type === 'array');
  }
</script>

{#if !definition}
  <p role="alert">
    {t.value(
      'tuple.configuration',
      'Tuple presentation requires positional schemas or equal non-negative minItems and maxItems on an array.',
    )}
  </p>
{:else}
  <div class="tuple-fields" class:vertical={options.vertical === true}>
    {#each definition.prefix as _, index}
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
