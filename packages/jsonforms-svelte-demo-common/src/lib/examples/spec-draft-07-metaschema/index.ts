import type { JsonSchema7, UISchemaElement } from '@jsonforms/core';
import { createLocalizedExample, type DemoExample } from '../definitions.js';
import { localizeSpecDocument } from '../spec-localization';
import schema from './schema.json';
import uischema from './uischema.json';
import data from './data.json';
import config from './config.json';
import translations from './translations.supplement.json';

/** Keep the official metaschema and its canonical $id intact. */
export const createSpecDraft07MetaschemaExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-draft-07-metaschema',
      label: 'Spec: Draft-07 metaschema',
      schema: schema as unknown as JsonSchema7,
      uischema: localizeSpecDocument(uischema, 'specDraft07Metaschema.ui') as UISchemaElement,
      data,
      config,
    },
    translations,
    getLocale,
  );
