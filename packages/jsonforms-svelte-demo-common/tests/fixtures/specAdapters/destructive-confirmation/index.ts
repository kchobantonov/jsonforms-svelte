import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import {
  mergeExampleTranslations,
  createLocalizedExample,
  type DemoExample,
} from '../../../../src/lib/examples/definitions.js';
import { localizeSpecDocument } from '../../../../src/lib/examples/spec-localization';
import schema from '@chobantonov/jsonforms-extended-spec/examples/destructive-confirmation/schema.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/destructive-confirmation/uischema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/destructive-confirmation/data.json';
import config from '@chobantonov/jsonforms-extended-spec/examples/destructive-confirmation/config.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/destructive-confirmation/translations.json';
import supplement from '@chobantonov/jsonforms-extended-spec/examples/destructive-confirmation/translations.json';

const hostSchema = structuredClone(schema);
for (const name of ['object', 'array'] as const) {
  Object.assign(hostSchema.properties.compositeRows.items.properties[name], {
    i18n: `specDestructiveConfirmation.schema.properties.compositeRows.items.properties.${name}`,
  });
}

export const createSpecDestructiveConfirmationExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-destructive-confirmation',
      label: 'Spec: Destructive-change confirmation',
      schema: localizeSpecDocument(
        hostSchema,
        'specDestructiveConfirmation.schema',
      ) as unknown as JsonSchema,
      uischema: localizeSpecDocument(uischema, 'specDestructiveConfirmation.ui') as UISchemaElement,
      data,
      config,
    },
    mergeExampleTranslations(translations, supplement),
    getLocale,
  );
