import type { UISchemaElement } from '@jsonforms/core';
import { createLocalizedExample, type DemoExample } from '../../examples/definitions.js';

export const createConfigControlEditingExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'config-control-editing',
      label: 'Local control editing',
      exampleSource: 'development',
      schema: {
        type: 'object',
        properties: {
          globalReadOnly: { type: 'string', title: 'Global read-only', maxLength: 4 },
          localWritable: { type: 'string', title: 'Local writable', maxLength: 4 },
          unrestricted: { type: 'string', title: 'Local unrestricted', maxLength: 4 },
          aliasWritable: { type: 'string', title: 'Alias writable', maxLength: 4 },
        },
      },
      uischema: {
        type: 'VerticalLayout',
        elements: [
          { type: 'Control', scope: '#/properties/globalReadOnly' },
          {
            type: 'Control',
            scope: '#/properties/localWritable',
            options: { readonly: false, clearable: true, restrict: true },
          },
          {
            type: 'Control',
            scope: '#/properties/unrestricted',
            options: { readonly: false },
          },
          {
            type: 'Control',
            scope: '#/properties/aliasWritable',
            options: { readOnly: false },
          },
        ],
      } as UISchemaElement,
      data: {
        globalReadOnly: 'Seed',
        localWritable: 'Seed',
        unrestricted: 'Seed',
        aliasWritable: 'Seed',
      },
      config: {
        readOnly: true,
        clearable: false,
        restrict: false,
        separateReadonlyFromDisabled: true,
      },
    },
    { en: {}, bg: {} },
    getLocale,
  );
