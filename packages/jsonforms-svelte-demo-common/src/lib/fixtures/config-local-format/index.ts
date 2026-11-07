import type { UISchemaElement } from '@jsonforms/core';
import { createLocalizedExample, type DemoExample } from '../../examples/definitions.js';

export const createConfigLocalFormatExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'config-local-format',
      label: 'Local format selection',
      exampleSource: 'development',
      schema: {
        type: 'object',
        properties: {
          date: { type: 'string', title: 'Local date' },
          time: { type: 'string', title: 'Local time' },
          dateTime: { type: 'string', title: 'Local date-time' },
          password: { type: 'string', title: 'Local password' },
          numeric: { type: 'number', title: 'Numeric with date hint' },
        },
      },
      uischema: {
        type: 'VerticalLayout',
        elements: [
          { type: 'Control', scope: '#/properties/date', options: { format: 'date' } },
          { type: 'Control', scope: '#/properties/time', options: { format: 'time' } },
          { type: 'Control', scope: '#/properties/dateTime', options: { format: 'date-time' } },
          { type: 'Control', scope: '#/properties/password', options: { format: 'password' } },
          { type: 'Control', scope: '#/properties/numeric', options: { format: 'date' } },
        ],
      } as UISchemaElement,
      data: {
        date: '2026-10-14',
        time: '12:30:00',
        dateTime: '2026-10-14T12:30:00',
        password: 'secret',
        numeric: 12,
      },
    },
    { en: {}, bg: {} },
    getLocale,
  );
