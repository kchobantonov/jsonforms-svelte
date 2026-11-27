import { mapSpecDocument } from '../../../../src/lib/examples/spec-localization';
import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import {
  createLocalizedExample,
  type DemoExample,
} from '../../../../src/lib/examples/definitions.js';
import schema from '@chobantonov/jsonforms-extended-spec/examples/combinators/schema.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/combinators/uischema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/combinators/data.json';
import config from '@chobantonov/jsonforms-extended-spec/examples/combinators/config.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/combinators/translations.json';

// Add catalog prefixes in the host adapter; preserve canonical fixture JSON.
function localize(value: unknown, kind: 'schema' | 'ui') {
  return mapSpecDocument(value, (node, path) => {
    if (
      (kind === 'schema' && typeof node.title === 'string') ||
      (kind === 'ui' && (node.type === 'Label' || node.type === 'Category'))
    ) {
      node.i18n = ['specCombinators.' + kind, ...path].join('/');
    }
  });
}

export const createSpecCombinatorsExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-combinators',
      label: 'Spec: Combinators and schema conditions',
      schema: localize(schema, 'schema') as JsonSchema,
      uischema: localize(uischema, 'ui') as UISchemaElement,
      data,
      config,
    },
    translations,
    getLocale,
  );
