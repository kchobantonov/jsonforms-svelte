import type { JsonFormsUISchemaRegistryEntry, JsonSchema, UISchemaElement } from '@jsonforms/core';

export type ExampleDescription = {
  name: string;
  label: string;
  note?: string;
  input: ExampleInputDescription;
};

export type ExampleInputDescription = {
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  uischemas?: JsonFormsUISchemaRegistryEntry[];
  data?: unknown;
  i18n?: Record<string, unknown>;
  config?: Record<string, unknown>;
};
