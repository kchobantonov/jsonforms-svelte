import { createLocalizedExample, type DemoExample } from '../../examples/definitions.js';

export const createConfigMarkupExamples = (getLocale: () => string): DemoExample[] =>
  (['default', 'disabled', 'extended', 'typography'] as const).map((kind) =>
    createLocalizedExample(
      {
        name: `config-markup-${kind}`,
        label: `Markup ${kind} configuration`,
        exampleSource: 'development',
        schema: { type: 'object' },
        uischema: {
          type: 'Label',
          text: kind === 'extended' ? '# Heading' : '**Bold**',
          options: { markup: 'markdown' },
        },
        data: {},
        ...(kind === 'default'
          ? {}
          : {
              config: {
                jsonformsExtended: {
                  markup:
                    kind === 'disabled'
                      ? { markdown: { enabled: false } }
                      : kind === 'extended'
                        ? { markdown: { profile: 'extended' } }
                        : { typography: false },
                },
              },
            }),
      },
      {},
      getLocale,
    ),
  );
