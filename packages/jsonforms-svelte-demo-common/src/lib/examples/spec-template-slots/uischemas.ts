import type { JsonFormsUISchemaRegistryEntry, UISchemaElement } from '@jsonforms/core';
import { localizeSpecDocument } from '../spec-localization';
// Trusted host adapter of the canonical uischemas.mjs; named lookup ignores testers.
const templates = [
  {
    type: 'Group',
    name: 'contact-card',
    label: 'Reusable contact',
    elements: [
      {
        type: 'Slot',
        name: 'heading',
        elements: [
          {
            type: 'Label',
            text: 'Default heading',
          },
        ],
      },
      {
        type: 'Slot',
        name: 'body',
        elements: [
          {
            type: 'Control',
            scope: '#/properties/name',
            label: 'Default name',
          },
        ],
      },
      {
        type: 'Slot',
        name: 'optional',
      },
    ],
  },
  {
    type: 'Group',
    name: 'nested-card',
    label: 'Nested composition',
    elements: [
      {
        type: 'Template',
        name: 'contact-card',
        elements: [
          {
            type: 'Label',
            name: 'heading',
            text: 'Local heading overrides inherited heading',
          },
        ],
      },
    ],
  },
];
export const uischemas: JsonFormsUISchemaRegistryEntry[] = templates.map((uischema, index) => ({
  tester: () => -1,
  uischema: localizeSpecDocument(
    uischema,
    `specTemplateSlots.registry.${index}`,
  ) as UISchemaElement,
}));
