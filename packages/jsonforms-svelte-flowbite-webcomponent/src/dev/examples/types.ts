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
  data?: any;
  i18n?: Record<string, any>;
  config?: Record<string, any>;
};
