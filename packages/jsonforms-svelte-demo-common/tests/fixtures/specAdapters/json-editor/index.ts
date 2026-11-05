import type { UISchemaElement } from '@jsonforms/core';
import {
  createLocalizedExample,
  type DemoExample,
} from '../../../../src/lib/examples/definitions.js';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/json-editor/uischema.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/json-editor/translations.json';
import schema from '@chobantonov/jsonforms-extended-spec/examples/json-editor/schema.json';

export const createSpecJsonEditorExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-json-editor',
      label: 'Spec: JSON editor',
      schema,
      uischema: uischema as UISchemaElement,
    },
    translations,
    getLocale,
  );
