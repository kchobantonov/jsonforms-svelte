import { isMixedSchema } from '@chobantonov/jsonforms-svelte';
import {
  isControl,
  rankWith,
  type JsonFormsRendererRegistryEntry,
  type JsonSchema,
  type TesterContext,
  type UISchemaElement,
} from '@jsonforms/core';

import mixedRenderer from './MixedRenderer.svelte';

export { isMixedSchema } from '@chobantonov/jsonforms-svelte';

export const isMixedControl = (
  uischema: UISchemaElement,
  schema: JsonSchema,
  context: TesterContext,
) =>
  isMixedSchema(uischema, schema, context) &&
  ((uischema.type === 'Control' && isControl(uischema)) || isDefaultGenUiSchema(uischema));

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: mixedRenderer,
  tester: rankWith(20, isMixedControl),
};

function isDefaultGenUiSchema(uischema: UISchemaElement): boolean {
  const elements = (uischema as UISchemaElement & { elements?: UISchemaElement[] })?.elements;
  let result = false;
  if (
    (uischema.type === 'VerticalLayout' || uischema.type === 'Group') &&
    Array.isArray(elements)
  ) {
    if (elements.length === 1) {
      // if the uischema is the default then take control
      result =
        elements[0].type === 'Control' && isControl(elements[0]) && elements[0].scope === '#';
    }
  }
  return result;
}
