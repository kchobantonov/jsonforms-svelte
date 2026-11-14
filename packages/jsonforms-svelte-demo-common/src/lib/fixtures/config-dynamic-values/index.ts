import { createLocalizedExample, type DemoExample } from '../../examples/definitions.js';

export const createConfigDynamicValuesExamples = (getLocale: () => string): DemoExample[] =>
  [false, true].map((enabled) =>
    createLocalizedExample(
      {
        name: `config-dynamic-values-${enabled ? 'enabled' : 'disabled'}`,
        label: `Dynamic Label values ${enabled ? 'enabled' : 'disabled'}`,
        exampleSource: 'development',
        schema: { type: 'object', properties: { name: { type: 'string' } } },
        uischema: {
          type: 'Label',
          text: 'Hello {name}',
          options: { interpolate: true, textParams: { name: '{data.name}' } },
        },
        data: { name: 'Ada' },
        config: { jsonformsExtended: { dynamicValues: { enabled } } },
      },
      {},
      getLocale,
    ),
  );
