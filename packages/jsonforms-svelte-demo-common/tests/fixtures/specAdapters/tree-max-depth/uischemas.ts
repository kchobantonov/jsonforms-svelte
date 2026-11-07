// Adapted from spec tree-max-depth/uischemas.mjs at f0183923295c495c60024fddca58dbe99e82e816.
// Trusted host registrations: branch layouts apply at every recursive depth.
import type { JsonFormsUISchemaRegistryEntry } from '@jsonforms/core';
export const uischemas: JsonFormsUISchemaRegistryEntry[] = [
  {
    tester: (schema) => (schema?.properties?.kind?.const === 'file' ? 10 : -1),
    uischema: {
      type: 'VerticalLayout',
      elements: [
        { type: 'Control', scope: '#/properties/name' },
        { type: 'Control', scope: '#/properties/content' },
      ],
    },
  },
  {
    tester: (schema) => (schema?.properties?.kind?.const === 'folder' ? 10 : -1),
    uischema: {
      type: 'VerticalLayout',
      elements: [
        { type: 'Control', scope: '#/properties/name' },
        {
          type: 'Control',
          scope: '#/properties/children',
          options: {
            detail: {
              type: 'Control',
              scope: '#',
              label: 'Kind',
              i18n: 'tree.kind',
            },
          },
        },
      ],
    },
  },
];
