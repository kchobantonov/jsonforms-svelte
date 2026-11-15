import { createLocalizedExample, type DemoExample } from '../../examples/definitions.js';

export const createConfigHeightExamples = (getLocale: () => string): DemoExample[] =>
  (['grid', 'split'] as const).flatMap((kind) =>
    [false, true].map((local) =>
      createLocalizedExample(
        {
          name: `config-${kind}-${local ? 'local' : 'flat'}-height`,
          label: `${local ? 'Local' : 'Flat'} ${kind} height`,
          exampleSource: 'development',
          schema:
            kind === 'grid'
              ? {
                  type: 'object',
                  properties: {
                    records: {
                      type: 'array',
                      items: { type: 'object', properties: { name: { type: 'string' } } },
                    },
                  },
                }
              : {
                  type: 'object',
                  properties: { first: { type: 'string' }, second: { type: 'string' } },
                },
          uischema:
            kind === 'grid'
              ? {
                  type: 'Control',
                  scope: '#/properties/records',
                  options: { variant: 'ag-grid', ...(local ? { height: '220px' } : {}) },
                }
              : {
                  type: 'VerticalLayout',
                  options: { variant: 'splitter', ...(local ? { height: '220px' } : {}) },
                  elements: [
                    { type: 'Control', scope: '#/properties/first' },
                    { type: 'Control', scope: '#/properties/second' },
                  ],
                },
          data:
            kind === 'grid' ? { records: [{ name: 'Ada' }] } : { first: 'Ada', second: 'Grace' },
          config: { height: 300, jsonformsExtended: { height: 700 } },
        },
        {
          en: { 'records.label': 'Records', 'first.label': 'First', 'second.label': 'Second' },
          bg: { 'records.label': 'Записи', 'first.label': 'Първи', 'second.label': 'Втори' },
        },
        getLocale,
      ),
    ),
  );

export const createConfigResizableExamples = (getLocale: () => string): DemoExample[] =>
  [false, true].map((local) =>
    createLocalizedExample(
      {
        name: `config-split-${local ? 'local' : 'flat'}-resizable`,
        label: `${local ? 'Local' : 'Flat'} split resizable`,
        exampleSource: 'development',
        schema: {
          type: 'object',
          properties: { first: { type: 'string' }, second: { type: 'string' } },
        },
        uischema: {
          type: 'HorizontalLayout',
          options: { variant: 'splitter', ...(local ? { resizable: true } : {}) },
          elements: [
            { type: 'Control', scope: '#/properties/first' },
            { type: 'Control', scope: '#/properties/second' },
          ],
        },
        data: { first: 'Ada', second: 'Grace' },
        config: { resizable: false, jsonformsExtended: { resizable: true } },
      },
      {
        en: { 'first.label': 'First', 'second.label': 'Second' },
        bg: { 'first.label': 'Първи', 'second.label': 'Втори' },
      },
      getLocale,
    ),
  );
