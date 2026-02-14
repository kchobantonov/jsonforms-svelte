<script lang="ts">
  import { Generate, type JsonSchema, type Layout, type UISchemaElement } from '@jsonforms/core';
  import { DispatchRenderer } from '@chobantonov/jsonforms-svelte';
  import omit from 'lodash/omit';

  interface CombinatorProps {
    schema: JsonSchema;
    combinatorKeyword: 'oneOf' | 'anyOf' | 'allOf';
    path: string;
    rootSchema: JsonSchema;
  }

  // Props
  let { schema, combinatorKeyword, path, rootSchema }: CombinatorProps = $props();

  const otherProps = $derived(omit(schema, combinatorKeyword) as JsonSchema);

  const foundUISchema = $derived(
    Generate.uiSchema(otherProps, 'VerticalLayout', undefined, rootSchema),
  );

  const isLayout = (uischema: UISchemaElement): uischema is Layout =>
    Object.prototype.hasOwnProperty.call(uischema, 'elements');

  const isLayoutWithElements = $derived.by(() => {
    if (foundUISchema !== null && isLayout(foundUISchema)) {
      return foundUISchema.elements.length > 0;
    }
    return false;
  });
</script>

{#if isLayoutWithElements}
  <div>
    <DispatchRenderer schema={otherProps} {path} uischema={foundUISchema} />
  </div>
{/if}
