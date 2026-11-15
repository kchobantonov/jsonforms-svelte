import { createLocalizedExample, type DemoExample } from '../../examples/definitions.js';

export const createConfigGridOptionsExamples = (getLocale: () => string): DemoExample[] =>
  [false, true].map((local) =>
    createLocalizedExample(
      {
        name: `config-grid-options-${local ? 'local' : 'flat'}`,
        label: `${local ? 'Local' : 'Flat'} AG Grid options`,
        exampleSource: 'development',
        schema: {
          type: 'object',
          properties: {
            records: {
              type: 'array',
              items: { type: 'object', properties: { name: { type: 'string' } } },
            },
          },
        },
        uischema: {
          type: 'Control',
          scope: '#/properties/records',
          options: {
            variant: 'ag-grid',
            ...(local ? { agGridOptions: { pagination: true, paginationPageSize: 4 } } : {}),
          },
        },
        data: {
          records: Array.from({ length: 8 }, (_, index) => ({ name: `Person ${index + 1}` })),
        },
        config: {
          agGridOptions: { pagination: false },
          jsonformsExtended: { agGridOptions: { pagination: true } },
        },
      },
      { en: { 'records.label': 'Records' }, bg: { 'records.label': 'Записи' } },
      getLocale,
    ),
  );
