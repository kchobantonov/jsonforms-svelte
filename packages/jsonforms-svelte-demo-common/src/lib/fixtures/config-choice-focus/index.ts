import { createLocalizedExample, type DemoExample } from '../../examples/definitions.js';

export const createConfigChoiceFocusExamples = (getLocale: () => string): DemoExample[] =>
  [false, true].map((radio) =>
    createLocalizedExample(
      {
        name: radio ? 'config-radio-focus' : 'config-choice-focus',
        label: radio ? 'Initial radio focus' : 'Initial choice focus',
        exampleSource: 'development',
        schema: {
          type: 'object',
          properties: { choice: { type: 'string', enum: ['A', 'B'] } },
        },
        uischema: {
          type: 'Control',
          scope: '#/properties/choice',
          ...(radio ? { options: { format: 'radio' } } : {}),
        },
        data: { choice: 'A' },
        config: { focus: true },
      },
      { en: { 'choice.label': 'Choice' }, bg: { 'choice.label': 'Избор' } },
      getLocale,
    ),
  );

export const createConfigSliderFocusExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'config-slider-focus',
      label: 'Initial slider focus',
      exampleSource: 'development',
      schema: {
        type: 'object',
        properties: {
          amount: { type: 'integer', minimum: 1, maximum: 6, default: 2, multipleOf: 2 },
        },
      },
      uischema: {
        type: 'Control',
        scope: '#/properties/amount',
        options: { slider: true },
      },
      data: { amount: 4 },
      config: { focus: true },
    },
    { en: { 'amount.label': 'Amount' }, bg: { 'amount.label': 'Количество' } },
    getLocale,
  );

export const createConfigMonacoFocusExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'config-monaco-focus',
      label: 'Initial code editor focus',
      exampleSource: 'development',
      schema: {
        type: 'object',
        properties: { code: { type: 'string' } },
      },
      uischema: {
        type: 'Control',
        scope: '#/properties/code',
        options: { format: 'code', language: 'javascript' },
      },
      data: { code: 'const answer = 42;' },
      config: { focus: true },
    },
    { en: { 'code.label': 'Code' }, bg: { 'code.label': 'Код' } },
    getLocale,
  );

export const createConfigMonacoDimensionExamples = (getLocale: () => string): DemoExample[] =>
  [false, true].map((local) =>
    createLocalizedExample(
      {
        name: local ? 'config-monaco-local-dimensions' : 'config-monaco-flat-dimensions',
        label: local ? 'Local code editor dimensions' : 'Flat code editor dimensions',
        exampleSource: 'development',
        schema: { type: 'object', properties: { code: { type: 'string' } } },
        uischema: {
          type: 'Control',
          scope: '#/properties/code',
          options: {
            format: 'code',
            language: 'javascript',
            ...(local ? { width: '240px', height: '12rem' } : {}),
          },
        },
        data: { code: 'const size = true;' },
        config: {
          width: 360,
          height: 180,
          jsonformsExtended: { width: 700, height: 700 },
        },
      },
      { en: { 'code.label': 'Code' }, bg: { 'code.label': 'Код' } },
      getLocale,
    ),
  );

export const createConfigExtendedFocusExamples = (getLocale: () => string): DemoExample[] =>
  [
    { kind: 'color', schema: { type: 'string', format: 'color' }, value: '#112233' },
    { kind: 'cron', schema: { type: 'string', format: 'cron' }, value: '0 0 * * *' },
    { kind: 'duration', schema: { type: 'string', format: 'duration' }, value: 'P1D' },
    { kind: 'file', schema: { type: 'string', format: 'byte' }, value: undefined },
    { kind: 'null', schema: { type: 'null' }, value: null },
  ].map(({ kind, schema, value }) =>
    createLocalizedExample(
      {
        name: `config-${kind}-focus`,
        label: `Initial ${kind} focus`,
        exampleSource: 'development',
        schema: { type: 'object', properties: { value: schema } },
        uischema: { type: 'Control', scope: '#/properties/value' },
        data: value === undefined ? {} : { value },
        config: { focus: true },
      },
      { en: { 'value.label': 'Value' }, bg: { 'value.label': 'Стойност' } },
      getLocale,
    ),
  );
