import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import {
  mergeExampleTranslations,
  createLocalizedExample,
  type DemoExample,
} from '../definitions.js';
import { localizeSpecDocument } from '../spec-localization';
import schema from './schema.json';
import sourceUi from './uischema.json';
import data from './data.json';
import config from './config.json';
import translations from './translations.json';
import supplement from './translations.supplement.json';

const ui = localizeSpecDocument(sourceUi, 'specAdditionalErrors.ui');
// Server text is a host annotation; canonical response examples remain unchanged.
function annotateServerErrors(value: unknown): void {
  if (!value || typeof value !== 'object') return;
  const node = value as Record<string, unknown>;
  if (node.action === 'reportServer') {
    const params = node.params as {
      errors: { instancePath: string; params: Record<string, unknown> }[];
    };
    for (const error of params.errors)
      error.params.i18n = `specAdditionalErrors.server.${error.instancePath.split('/').at(-1)}`;
  }
  Object.values(node).forEach(annotateServerErrors);
}
annotateServerErrors(ui);
export const createSpecAdditionalErrorsExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-additional-errors',
      label: 'Spec: Additional errors: server and editor',
      schema: localizeSpecDocument(schema, 'specAdditionalErrors.schema') as JsonSchema,
      uischema: ui as UISchemaElement,
      data,
      config,
    },
    mergeExampleTranslations(translations, supplement),
    getLocale,
  );
