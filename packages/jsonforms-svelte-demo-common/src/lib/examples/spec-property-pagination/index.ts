import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { createLocalizedExample, type DemoExample } from '../definitions.js';
import { localizeDetailSchema } from '../spec-detail-localization';
import schema from './schema.json';
import uischema from './uischema.json';
import data from './data.json';
import config from './config.json';
import translations from './translations.supplement.json';
export const createSpecPropertyPaginationExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-property-pagination',
      label: 'Spec: Property pagination',
      schema: localizeDetailSchema(schema as JsonSchema),
      uischema: uischema as UISchemaElement,
      data,
      config,
    },
    translations,
    getLocale,
  );
