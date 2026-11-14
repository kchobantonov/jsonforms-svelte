import type { JsonSchema } from '@jsonforms/core';
import rule from './specification/rule.json';
import schema from './specification/schema.json';
import uischema from './specification/uischema.json';
import uischemas from './specification/uischemas.json';
import dynamicUiSchema from '@chobantonov/jsonforms-extended-spec/schemas/jsonforms-dynamic-uischema.schema.json';

// Monaco uses this older, closed UI meta-schema. Admit the experimental
// descriptor on every element shape so the live playground can be edited.
// Keep the published portable schema separate from this editor profile.
const editorUiSchema = structuredClone(uischema) as unknown as {
  definitions: Record<string, { properties?: Record<string, unknown> }>;
};
const dynamicDefinitions = JSON.parse(
  JSON.stringify(dynamicUiSchema.$defs).replaceAll('#/$defs/', '#/definitions/dynamic-'),
) as Record<string, unknown>;
for (const [name, definition] of Object.entries(dynamicDefinitions)) {
  editorUiSchema.definitions[`dynamic-${name}`] = definition as {
    properties?: Record<string, unknown>;
  };
}
for (const definition of Object.values(editorUiSchema.definitions)) {
  if (definition.properties?.type) {
    definition.properties.$dynamic = { $ref: '#/definitions/dynamic-dynamic' };
  }
}

export const jsonSchemaDraft7 = {
  uri: 'http://json-schema.org/draft-07/schema',
  schema: schema as unknown as JsonSchema,
};

export const uiSchema = {
  uri: 'http://jsonforms.io/uischema',
  schema: editorUiSchema as JsonSchema,
};
export const uiSchemas = {
  uri: 'http://jsonforms.io/uischemas',
  schema: uischemas as JsonSchema,
};
export const ruleSchema = {
  uri: 'http://jsonforms.io/uischema/rule',
  schema: rule as JsonSchema,
};
