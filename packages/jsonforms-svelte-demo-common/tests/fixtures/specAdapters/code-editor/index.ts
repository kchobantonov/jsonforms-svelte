import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import {
  createLocalizedExample,
  type DemoExample,
} from '../../../../src/lib/examples/definitions.js';
import schema from '@chobantonov/jsonforms-extended-spec/examples/code-editor/schema.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/code-editor/uischema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/code-editor/data.json';
import sourceTranslations from '@chobantonov/jsonforms-extended-spec/examples/code-editor/translations.json';
const translations = sourceTranslations;

export const createSpecCodeEditorExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-code-editor',
      label: 'Spec: Code editor',
      schema: schema as unknown as JsonSchema,
      uischema: uischema as UISchemaElement,
      data,
    },
    translations,
    getLocale,
  );
