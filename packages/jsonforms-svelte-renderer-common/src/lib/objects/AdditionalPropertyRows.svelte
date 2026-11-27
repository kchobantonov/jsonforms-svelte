<script lang="ts">
  import type { useJsonFormsControlWithDetail } from '../core/jsonFormsCompositions.svelte';
  import type { useAdditionalPropertyEditor } from './additionalPropertyEditor.svelte';
  import type { Snippet } from 'svelte';
  import type { ErrorObject } from 'ajv';
  import type { ControlElement, JsonSchema } from '@jsonforms/core';
  import type { usePropertyNameErrors } from '../validation/objectErrors.svelte';
  import LiteralControl from './LiteralControl.svelte';
  const {
    control,
    editor,
    nameErrors,
    actions,
    errorIcon,
    invalidClass,
    padEmptyName = false,
  }: {
    control: ReturnType<typeof useJsonFormsControlWithDetail>['control'];
    editor: ReturnType<typeof useAdditionalPropertyEditor>;
    nameErrors: ReturnType<typeof usePropertyNameErrors>;
    actions: Snippet<[string]>;
    errorIcon: Snippet<[ErrorObject[]]>;
    invalidClass: string;
    padEmptyName?: boolean;
  } = $props();
  type PropertyItem = (typeof editor.collection.items)[number];
</script>

{#snippet propertyRow(element: PropertyItem)}
  {#if element.uischema}
    {@const errors = nameErrors.errors.get(element.propertyName)}
    <div
      data-additional-property-row
      class={nameErrors.errors.has(element.propertyName) ? invalidClass : 'relative'}
      class:pt-2={padEmptyName && element.propertyName === '' && control.enabled}
    >
      {#snippet nameErrorMarker()}
        {#if errors}
          <span data-property-name-error>{@render errorIcon(errors)}</span>
        {/if}
      {/snippet}
      {#if control.enabled}{@render actions(element.propertyName)}{/if}

      <LiteralControl
        existingOnly
        preservePropertyOnClear
        labelAccessory={nameErrorMarker}
        identity={editor.collection.keys.get(element.propertyName)}
        schema={{
          type: 'object',
          properties: { [element.propertyName]: element.schema },
          required: control.schema.required,
        } as JsonSchema}
        uischema={{
          ...(element.uischema.type === 'Control'
            ? element.uischema
            : { type: 'Control', options: { detail: element.uischema } }),
          scope: '#/properties/' + element.propertyName.replaceAll('~', '~0').replaceAll('/', '~1'),
          label: element.propertyName === '' ? '\u00a0' : element.propertyName,
        } as ControlElement}
        path={control.path}
        enabled={control.enabled && !control.readonly}
        renderers={control.renderers}
        cells={control.cells}
      />
    </div>
  {/if}
{/snippet}

{#each editor.page.indices.map((index) => editor.collection.items[index]) as element (editor.collection.keys.get(element.propertyName))}
  {@render propertyRow(element)}
{/each}
