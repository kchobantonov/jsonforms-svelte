import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { createLocalizedExample, type DemoExample } from '../definitions.js';
import { createTranslator } from '../../i18n/i18n.js';
import { localizeSpecDocument } from '../spec-localization';
import schema from './schema.json';
import sourceUi from './uischema.json';
import data from './data.json';
import config from './config.json';
import translations from './translations.supplement.json';

export const createSpecAgGridExample = (getLocale: () => string): DemoExample => {
  const ui = localizeSpecDocument(sourceUi, 'specAgGrid.ui');
  // Native header overrides remain native. The host supplies their translation
  // through AG Grid's public callback instead of changing renderer precedence.
  function localizeHeaders(value: unknown, path: string[]): void {
    if (!value || typeof value !== 'object') return;
    const node = value as Record<string, unknown>;
    if (typeof node.headerName === 'string') {
      const fallback = node.headerName;
      node.headerValueGetter = () =>
        createTranslator(getLocale(), translations)([...path, 'headerName'].join('.'), fallback);
    }
    for (const [key, child] of Object.entries(node)) localizeHeaders(child, [...path, key]);
  }
  localizeHeaders(ui, ['specAgGrid.ui']);
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
