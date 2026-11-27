import { withIntroLabels } from '../introLabels';
import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import {
  createLocalizedExample,
  type DemoExample,
} from '../../../../src/lib/examples/definitions.js';
import schema from '@chobantonov/jsonforms-extended-spec/examples/string-controls/schema.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/string-controls/uischema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/string-controls/data.json';
import config from '@chobantonov/jsonforms-extended-spec/examples/string-controls/config.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/string-controls/translations.json';
const localizedUiSchema = withIntroLabels(uischema, 'stringIntro');
export const createSpecStringControlsExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-string-controls',
      label: 'Spec: String controls',
      schema: schema as unknown as JsonSchema,
      uischema: localizedUiSchema as UISchemaElement,
      data,
      config,
    },
    translations,
    getLocale,
  );
