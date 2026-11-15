import type { JsonSchema7, UISchemaElement } from '@jsonforms/core';
import {
  createLocalizedExample,
  type DemoExample,
} from '../../../../src/lib/examples/definitions.js';
import { localizeSpecDocument } from '../../../../src/lib/examples/spec-localization';
import schema from '@chobantonov/jsonforms-extended-spec/examples/draft-07-metaschema/schema.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/draft-07-metaschema/uischema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/draft-07-metaschema/data.json';
import config from '@chobantonov/jsonforms-extended-spec/examples/draft-07-metaschema/config.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/draft-07-metaschema/translations.json';

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
