import type { UISchemaElement } from '@jsonforms/core';
import { createLocalizedExample, type DemoExample } from '../../examples/definitions.js';

export const createConfigControlHintsExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'config-control-hints',
      label: 'Local control hints',
      exampleSource: 'development',
      schema: {
        type: 'object',
        properties: {
          inherited: {
            type: 'string',
            title: 'Inherited hints',
            description: 'Inherited description',
          },
          local: {
            type: 'string',
            title: 'Local hints',
            description: 'Local description',
          },
        },
        required: ['inherited', 'local'],
      },
      uischema: {
        type: 'VerticalLayout',
        elements: [
          { type: 'Control', scope: '#/properties/inherited' },
          {
            type: 'Control',
            scope: '#/properties/local',
            options: {
              placeholder: '',
              hideRequiredAsterisk: false,
              showUnfocusedDescription: false,
            },
          },
        ],
      } as UISchemaElement,
      data: { inherited: 'Initial inherited', local: 'Initial local' },
      config: {
        placeholder: 'Global hint',
        hideRequiredAsterisk: true,
        showUnfocusedDescription: true,
      },
    },
    { en: {}, bg: {} },
    getLocale,
  );
