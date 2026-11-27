import { annotateFixture } from '../annotate.js';
import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import {
  mergeExampleTranslations,
  createLocalizedExample,
  type DemoExample,
} from '../../../../src/lib/examples/definitions.js';
import schema from '@chobantonov/jsonforms-extended-spec/examples/array-choices/schema.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/array-choices/uischema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/array-choices/data.json';
import config from '@chobantonov/jsonforms-extended-spec/examples/array-choices/config.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/array-choices/translations.json';
import supplements from '@chobantonov/jsonforms-extended-spec/examples/array-choices/translations.json';

function localizedUi(): UISchemaElement {
  let index = 0;
  return annotateFixture(uischema, (node) =>
    node.type === 'Label' ? { i18n: `specArrayChoices.text${index++}` } : {},
  ) as UISchemaElement;
}
export const createSpecArrayChoicesExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-array-choices',
      label: 'Spec: Array choices',
      schema: schema as JsonSchema,
      uischema: localizedUi(),
      data,
      config,
    },
    mergeExampleTranslations(translations, supplements),
    getLocale,
  );
