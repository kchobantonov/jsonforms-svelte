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

export function createExampleRegistry() {
  const examples = new Map<string, ExampleDescription>();
  return {
    registerExamples(entries: ExampleDescription[]) {
      for (const entry of entries) examples.set(entry.name, entry);
    },
    getExamples() {
      return [...examples.values()].sort((a, b) => a.label.localeCompare(b.label));
    },
  };
}
