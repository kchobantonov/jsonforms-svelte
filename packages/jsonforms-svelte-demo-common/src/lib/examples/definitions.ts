import type { JsonFormsI18nState, JsonSchema, UISchemaElement } from '@jsonforms/core';
import type { ExampleDescription } from '@jsonforms/examples';
import { createTranslator } from '../i18n/i18n.js';
import type { DemoActionEvent } from './actions.js';

export type DemoExamplesVariant = 'skeleton' | 'flowbite' | 'shadcn';

export type DemoExample = Omit<ExampleDescription, 'schema' | 'uischema' | 'data'> & {
  exampleSource?: 'spec' | 'jsonforms' | 'development';
  spec?: {
    id: string;
    revision: string;
    source: string;
    hostRequirements: readonly string[];
  };
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  data?: unknown;
  i18n?: JsonFormsI18nState & { translations?: Record<string, unknown> };
  onHandleAction?: (event: DemoActionEvent) => void | Promise<void>;
};

/** Merge message keys per locale without restricting the languages in JSON assets. */
export function mergeExampleTranslations(
  ...sources: Record<string, Record<string, unknown>>[]
): Record<string, Record<string, unknown>> {
  const locales = new Set(sources.flatMap((source) => Object.keys(source)));
  return Object.fromEntries(
    [...locales].map((locale) => [
      locale,
      sources.reduce<Record<string, unknown>>(
        (messages, source) => ({
          ...messages,
          ...(Object.hasOwn(source, locale) ? source[locale] : {}),
        }),
        {},
      ),
    ]),
  );
}

export const createStaticExample = (example: DemoExample): DemoExample => example;

export const createLocalizedExample = (
  example: Omit<DemoExample, 'i18n'>,
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
