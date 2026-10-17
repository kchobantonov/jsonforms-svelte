import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { createLocalizedExample, type DemoExample } from '../definitions.js';
import { localizeDetailSchema } from '../spec-detail-localization';
import schema from './schema.json';
import uischema from './uischema.json';
import data from './data.json';
import config from './config.json';
import translations from './translations.supplement.json';
export const createSpecCollectionPaginationExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-collection-pagination',
      label: 'Spec: Collection pagination',
      schema: localizeDetailSchema(schema as JsonSchema),
      uischema: uischema as UISchemaElement,
      data,
      config,
    },
    translations,
    getLocale,
  );
