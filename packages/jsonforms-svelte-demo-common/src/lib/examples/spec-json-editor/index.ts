import type { UISchemaElement } from '@jsonforms/core';
import { createLocalizedExample, type DemoExample } from '../definitions.js';
import uischema from './uischema.json';
import translations from './translations.json';
import schema from './schema.json';

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
