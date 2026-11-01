import { createLocalizedExample, type DemoExample } from '../../examples/definitions.js';
import type { UISchemaElement } from '@jsonforms/core';

export const createConfigNumericStepExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'config-numeric-step',
      label: 'Local numeric step',
      exampleSource: 'development',
      schema: {
        type: 'object',
        properties: {
          decimalDefault: { type: 'number', title: 'Decimal schema step', multipleOf: 0.25 },
          decimalLocal: { type: 'number', title: 'Decimal local step', multipleOf: 0.25 },
          integerDefault: { type: 'integer', title: 'Integer schema step', multipleOf: 2 },
          integerLocal: { type: 'integer', title: 'Integer local step', multipleOf: 2 },
        },
      },
      uischema: {
        type: 'VerticalLayout',
        elements: [
          { type: 'Control', scope: '#/properties/decimalDefault' },
          { type: 'Control', scope: '#/properties/decimalLocal', options: { step: 3 } },
          { type: 'Control', scope: '#/properties/integerDefault' },
          { type: 'Control', scope: '#/properties/integerLocal', options: { step: 3 } },
        ],
      } as UISchemaElement,
      data: { decimalDefault: 1, decimalLocal: 1, integerDefault: 2, integerLocal: 2 },
      config: { step: 5 },
    },
    { en: {}, bg: {} },
    getLocale,
  );
