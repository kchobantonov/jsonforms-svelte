import { createLocalizedExample, type DemoExample } from '../../examples/definitions.js';

export const createConfigInitialFocusExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'config-initial-focus',
      label: 'Initial focus configuration',
      exampleSource: 'development',
      schema: {
        type: 'object',
        properties: { name: { type: 'string' } },
      },
      uischema: { type: 'Control', scope: '#/properties/name' },
      data: { name: 'Ada' },
      config: { focus: true },
    },
    { en: { 'name.label': 'Name' }, bg: { 'name.label': 'Име' } },
    getLocale,
  );
