import { createLocalizedExample, type DemoExample } from '../../examples/definitions.js';
import type { UISchemaElement } from '@jsonforms/core';

export const createConfigTemplateLanguageExamples = (getLocale: () => string): DemoExample[] =>
  (['flat', 'namespaced', 'explicit'] as const).map((kind) =>
    createLocalizedExample(
      {
        name: `config-template-language-${kind}`,
        label: `Template language ${kind} precedence`,
        exampleSource: 'development',
        schema: { type: 'object' },
        uischema: {
          type: 'TemplateLayout',
          ...(kind === 'explicit' ? { lang: 'ractive' } : {}),
          template: '<div class="template-language-ok">Ready</div>',
          elements: [],
        } as UISchemaElement,
        data: {},
        config: {
          defaultTemplateLang: 'ractive',
          jsonformsExtended: {
            security: { allowScriptEvaluation: true },
            ...(kind === 'flat' ? {} : { defaultTemplateLang: 'unavailable' }),
          },
        },
      },
      {},
      getLocale,
    ),
  );
