import { createStaticExample, type DemoExample } from '../definitions.js';
export const createBracketPropertiesExample = (): DemoExample =>
  createStaticExample({
    name: 'bracket-properties',
    label: 'Additional properties (literal names)',
    schema: {
      type: 'object',
      properties: {
        'group[0]': { type: 'object', additionalProperties: { type: 'string' } },
        nested: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            propertyNames: { minLength: 1 },
            additionalProperties: true,
          },
        },
      },
    },
    uischema: {
      type: 'VerticalLayout',
      elements: [
        { type: 'Control', scope: '#/properties/group[0]' },
        {
          type: 'Control',
          scope: '#/properties/nested',
          label: 'Nested literal keys (mixed tree)',
        },
      ],
    },
    data: {
      nested: {
        '': { asd: { '': 'Edit this empty key in the tree', 'a.b': 'A literal dotted key' } },
      },
      'group[0]': {
        'test[0]': 'Bracketed key',
        '15': 'Numeric object key',
        'a.b': 'Literal dotted key',
        '': 'Empty property name',
        '  spaced  ': 'Whitespace is preserved',
      },
    },
  });
