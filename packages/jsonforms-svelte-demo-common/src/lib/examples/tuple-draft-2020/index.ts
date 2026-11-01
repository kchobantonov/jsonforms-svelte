import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { createLocalizedExample, type DemoExample } from '../definitions.js';
import translations from './translations.json';

const schema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  properties: {
    coordinates: {
      type: 'array',
      title: 'Coordinates',
      i18n: 'tuple2020.coordinates',
      prefixItems: [
        { type: 'number', title: 'X', i18n: 'tuple2020.x' },
        { type: 'number', title: 'Y', i18n: 'tuple2020.y' },
      ],
      items: false,
    },
    survey: {
      type: 'array',
      title: 'Survey point',
      i18n: 'tuple2020.survey',
      prefixItems: [
        { type: 'number', title: 'Latitude', i18n: 'tuple2020.latitude' },
        { type: 'number', title: 'Longitude', i18n: 'tuple2020.longitude', minimum: 0 },
        { type: 'number', title: 'Elevation', i18n: 'tuple2020.elevation' },
      ],
      items: false,
    },
  },
} as unknown as JsonSchema;

export const createTupleDraft2020Example = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'tuple-draft-2020',
      label: 'Tuple: Draft 2020-12',
      schema,
      uischema: {
        type: 'VerticalLayout',
        elements: [
          {
            type: 'Control',
            scope: '#/properties/coordinates',
            options: {
              detail: {
                type: 'VerticalLayout',
                elements: [
                  { type: 'Control', scope: '#/prefixItems/1' },
                  { type: 'Control', scope: '#/prefixItems/0' },
                ],
              },
            },
          },
          {
            type: 'Control',
            scope: '#/properties/survey',
            options: {
              detail: {
                type: 'VerticalLayout',
                elements: [
                  { type: 'Control', scope: '#/prefixItems/0' },
                  { type: 'Control', scope: '#/prefixItems/2' },
                ],
              },
            },
          },
        ],
      } as UISchemaElement,
      data: { coordinates: [1, 2, 3], survey: [45, -2, 3] },
      validatorDialect: 'draft-2020-12',
    },
    translations,
    getLocale,
  );
