import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import {
  mergeExampleTranslations,
  createLocalizedExample,
  type DemoExample,
} from '../../../../src/lib/examples/definitions.js';
import { localizeSpecDocument } from '../../../../src/lib/examples/spec-localization';
import schema from '@chobantonov/jsonforms-extended-spec/examples/additional-errors/schema.json';
import sourceUi from '@chobantonov/jsonforms-extended-spec/examples/additional-errors/uischema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/additional-errors/data.json';
import config from '@chobantonov/jsonforms-extended-spec/examples/additional-errors/config.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/additional-errors/translations.json';
import supplement from '@chobantonov/jsonforms-extended-spec/examples/additional-errors/translations.json';

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
