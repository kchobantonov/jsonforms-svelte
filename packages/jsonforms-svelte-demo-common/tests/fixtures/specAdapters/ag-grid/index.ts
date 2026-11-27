import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import {
  createLocalizedExample,
  type DemoExample,
} from '../../../../src/lib/examples/definitions.js';
import { localizeSpecAgGridHeaders } from '../../../../src/lib/examples/spec-ag-grid-headers.js';
import { localizeSpecDocument } from '../../../../src/lib/examples/spec-localization';
import schema from '@chobantonov/jsonforms-extended-spec/examples/ag-grid/schema.json';
import sourceUi from '@chobantonov/jsonforms-extended-spec/examples/ag-grid/uischema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/ag-grid/data.json';
import config from '@chobantonov/jsonforms-extended-spec/examples/ag-grid/config.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/ag-grid/translations.json';

export const createSpecAgGridExample = (getLocale: () => string): DemoExample => {
  const ui = localizeSpecDocument(sourceUi, 'specAgGrid.ui');
  // Native header overrides remain native. The host supplies their translation
  // through AG Grid's public callback instead of changing renderer precedence.
  localizeSpecAgGridHeaders(ui, getLocale, translations);
  return createLocalizedExample(
    {
      name: 'spec-ag-grid',
      label: 'Spec: AG Grid: portable options and native overrides',
      schema: localizeSpecDocument(schema, 'specAgGrid.schema') as JsonSchema,
      uischema: ui as UISchemaElement,
      data,
      config,
    },
    translations,
    getLocale,
  );
};
