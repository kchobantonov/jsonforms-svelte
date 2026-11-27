import { withIntroLabels } from '../introLabels';
import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import {
  createLocalizedExample,
  type DemoExample,
} from '../../../../src/lib/examples/definitions.js';
import schema from '@chobantonov/jsonforms-extended-spec/examples/color-control/schema.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/color-control/uischema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/color-control/data.json';
import config from '@chobantonov/jsonforms-extended-spec/examples/color-control/config.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/color-control/translations.json';
const localizedUiSchema = withIntroLabels(uischema, 'colorIntro');

export const createSpecColorControlExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-color-control',
      label: 'Spec: Color control',
      schema: schema as unknown as JsonSchema,
      uischema: localizedUiSchema as UISchemaElement,
      data,
      config,
    },
    translations,
    getLocale,
  );
