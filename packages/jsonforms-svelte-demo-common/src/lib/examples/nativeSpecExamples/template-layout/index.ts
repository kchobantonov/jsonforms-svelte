import { defineNativeTemplate } from '@chobantonov/jsonforms-svelte-extended';
import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import {
  mergeExampleTranslations,
  createLocalizedExample,
  type DemoExample,
} from '../../definitions.js';
import { localizeSpecDocument } from '../../spec-localization';
import schema from '@chobantonov/jsonforms-extended-spec/examples/template-layout/schema.json';
import sourceUi from '@chobantonov/jsonforms-extended-spec/examples/template-layout/uischema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/template-layout/data.json';
import config from '@chobantonov/jsonforms-extended-spec/examples/template-layout/config.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/template-layout/translations.json';
import supplement from '@chobantonov/jsonforms-extended-spec/examples/template-layout/translations.json';
import NativeRegistrationTemplate from './NativeRegistrationTemplate.svelte';

// Host annotations leave the canonical documents unchanged. Localize Ractive text,
// and append a compiled Svelte component at the trusted host boundary.
const ui = localizeSpecDocument(sourceUi, 'specTemplateLayout.ui');
const localizeTemplates = (value: unknown): void => {
  if (Array.isArray(value)) {
    value.forEach(localizeTemplates);
    return;
  }
  if (!value || typeof value !== 'object') return;
  const node = value as Record<string, unknown>;
  if (
    node.type === 'TemplateLayout' &&
    (!node.lang || node.lang === 'ractive') &&
    typeof node.template === 'string'
  ) {
    for (const [text, key] of [
      ['Hello', 'greeting'],
      ['Priority booking', 'priority'],
      ['Standard booking', 'standard'],
      ['Contacts', 'contacts'],
      ['Resolved by config', 'resolved'],
    ])
      node.template = (node.template as string).replaceAll(
        text,
        `{{translate("specTemplateLayout.${key}")}}`,
      );
  }
  Object.values(node).forEach(localizeTemplates);
};
localizeTemplates(ui);
const categories = ui.elements.find((element) => element.type === 'Categorization')!;
(categories.elements as unknown[]).push({
  type: 'Category',
  label: 'Native Svelte component',
  i18n: 'specTemplateLayout.native',
  elements: [
    {
      type: 'TemplateLayout',
      template: defineNativeTemplate(NativeRegistrationTemplate),
      elements: [{ type: 'Control', scope: '#/properties/nativeNote', name: 'nativeNote' }],
    },
  ],
});
export const createSpecTemplateLayoutExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-template-layout',
      label: 'Spec: Template engines',
      schema: localizeSpecDocument(schema, 'specTemplateLayout.schema') as JsonSchema,
      uischema: ui as UISchemaElement,
      data,
      config,
    },
    mergeExampleTranslations(translations, supplement),
    getLocale,
  );
