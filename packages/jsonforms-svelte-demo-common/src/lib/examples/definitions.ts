import type { JsonFormsI18nState, JsonSchema, UISchemaElement } from '@jsonforms/core';
import type { ExampleDescription } from '@jsonforms/examples';
import { createTranslator } from '../i18n/i18n.js';
import type { DemoActionEvent } from './actions.js';

export type DemoExamplesVariant = 'skeleton' | 'flowbite';

export type DemoExample = ExampleDescription & {
  i18n?: JsonFormsI18nState & { translations?: Record<string, unknown> };
  onHandleAction?: (event: DemoActionEvent) => void | Promise<void>;
};

export const createStaticExample = (
  example: Omit<DemoExample, 'uischema' | 'schema'> & {
    schema: JsonSchema;
    uischema: UISchemaElement;
  },
): DemoExample => example;

export const createLocalizedExample = (
  example: Omit<DemoExample, 'i18n' | 'uischema' | 'schema'> & {
    schema: JsonSchema;
    uischema: UISchemaElement;
  },
  translations: Record<string, unknown>,
  getLocale: () => string,
): DemoExample => ({
  ...example,
  get i18n() {
    const locale = getLocale();
    return {
      locale,
      translate: createTranslator(locale, translations),
      translations,
    };
  },
});
