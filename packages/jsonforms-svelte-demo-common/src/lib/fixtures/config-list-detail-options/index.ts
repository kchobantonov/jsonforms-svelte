import { createLocalizedExample, type DemoExample } from '../../examples/definitions.js';
import type { UISchemaElement } from '@jsonforms/core';

export const createConfigListDetailOptionExamples = (getLocale: () => string): DemoExample[] => [
  createLocalizedExample(
    {
      name: 'config-list-detail-options',
      label: 'List detail local options',
      exampleSource: 'development',
      schema: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            minItems: 2,
            maxItems: 2,
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', minLength: 10 },
                alias: { type: 'string' },
              },
              required: ['name'],
            },
          },
        },
      },
      uischema: {
        type: 'ListWithDetail',
        scope: '#/properties/items',
        options: {
          detail: { type: 'Label', text: 'Configured detail' },
          elementLabelProp: 'alias',
          hideArraySummaryValidation: true,
          restrict: true,
          showSortButtons: true,
        },
      } as UISchemaElement,
      data: {
        items: [
          { name: 'Ada', alias: 'Alpha' },
          { name: 'Grace', alias: 'Beta' },
        ],
      },
      config: {
        elementLabelProp: 'name',
        hideArraySummaryValidation: false,
        restrict: false,
        showSortButtons: false,
      },
    },
    { en: { 'items.label': 'Contacts' }, bg: { 'items.label': 'Контакти' } },
    getLocale,
  ),
];
