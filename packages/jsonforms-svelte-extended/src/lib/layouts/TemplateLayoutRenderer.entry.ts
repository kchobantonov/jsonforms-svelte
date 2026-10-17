import { templateLanguage } from '../core/templateLanguage';
import {
  type JsonFormsRendererRegistryEntry,
  type JsonSchema,
  type Tester,
  type TesterContext,
  type UISchemaElement,
} from '@jsonforms/core';
import templateLayoutRenderer from './TemplateLayoutRenderer.svelte';

export const langIs =
  (expected: string): Tester =>
  (
    uischema: UISchemaElement & { lang?: string },
    _schema: JsonSchema,
    context: TesterContext,
  ): boolean => {
    return templateLanguage(uischema, context.config) === expected;
  };

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: templateLayoutRenderer,
  // Rank below a registered engine so unsupported documents receive a diagnostic.
  tester: (uischema, schema, context) =>
    uischema.type !== 'TemplateLayout' ? -1 : langIs('ractive')(uischema, schema, context) ? 2 : 1,
};
