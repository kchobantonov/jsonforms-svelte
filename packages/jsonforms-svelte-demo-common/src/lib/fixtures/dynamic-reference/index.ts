import type { JsonSchema } from '@jsonforms/core';
import { createLocalizedExample, type DemoExample } from '../../examples/definitions.js';

export const createDynamicReferenceExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'dynamic-reference',
      label: 'Unsupported dynamic schema reference',
      exampleSource: 'development',
      schema: {
        $id: 'https://example.test/node.json',
        $dynamicAnchor: 'node',
        type: 'object',
        properties: { value: { $dynamicRef: '#node' } },
      } as JsonSchema,
      uischema: { type: 'Control', scope: '#/properties/value' },
      data: { value: { label: 'Leaf' } },
    },
    {
      en: { 'value.label': 'Value' },
      bg: { 'value.label': 'Стойност' },
    },
    getLocale,
  );
