import { createTranslator, type i18nJsonSchema } from '@jsonforms/core';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { afterEach, expect, it } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';
import { shadcnRenderers, shadcnCells } from '../../src/lib';
import { entry as table } from '../../src/lib/complex/ArrayControlRenderer.entry';
import { entry as layout } from '../../src/lib/layouts/ArrayLayoutRenderer.entry';
import { entry as masterDetail } from '../../src/lib/additional/ListWithDetailRenderer.entry';

afterEach(cleanup);

it.each([
  ['table', table],
  ['layout', layout],
  ['master/detail', masterDetail],
] as const)(
  '%s keeps own errors visible when child summaries are hidden and honors local false',
  async (_name, entry) => {
    const props = {
      schema: {
        type: 'array',
        minItems: 2,
        items: { type: 'object', properties: { name: { type: 'string', minLength: 3 } } },
      },
      data: [{ name: 'x' }],
      uischema: { type: 'Control', scope: '#', options: { hideArraySummaryValidation: true } },
      config: { hideArraySummaryValidation: true },
      renderers: [...shadcnRenderers, { ...entry, tester: () => 100 }],
      cells: shadcnCells,
    };
    // Limit the forced entry to this array so nested fields use their normal registry.
    props.renderers[props.renderers.length - 1].tester = (ui, schema, context) =>
      ui.type === 'Control' && 'scope' in ui && ui.scope === '#' && schema.type === 'array'
        ? 100
        : entry.tester(ui, schema, context);
    const view = await render(JsonForms, { props });
    expect(view.container.querySelector('[data-array-own-errors]')?.textContent).toContain('2');
    expect(view.container.querySelector('[data-array-summary]')).toBeNull();
    await view.rerender({
      ...props,
      uischema: { ...props.uischema, options: { hideArraySummaryValidation: false } },
    });
    expect(view.container.querySelector('[data-array-summary]')).not.toBeNull();
    expect(view.container.querySelector('[data-array-own-errors]')?.textContent).toContain('2');
    await view.rerender({
      ...props,
      config: { hideArraySummaryValidation: false, showValidationIndicator: false },
      uischema: { ...props.uischema, options: { hideArraySummaryValidation: false } },
    });
    expect(view.container.querySelector('[data-array-summary]')).toBeNull();
    expect(view.container.querySelector('[data-array-own-errors]')?.textContent).toContain('2');
  },
);

it('translates table headings on locale changes and preserves empty labels', async () => {
  const nameSchema = {
    type: 'string',
    title: 'Document name',
    i18n: 'document',
  } satisfies i18nJsonSchema;
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: nameSchema,
          },
        },
      },
      data: [{ name: 'Example' }],
      uischema: { type: 'Control', scope: '#' },
      renderers: [...shadcnRenderers, { ...table, tester: () => 100 }],
      cells: shadcnCells,
      i18n: { locale: 'en', translate: createTranslator((_key, fallback) => fallback) },
    },
  });
  expect(view.container.querySelector('thead')?.textContent).toContain('Document name');
  await view.rerender({
    i18n: {
      locale: 'bg',
      translate: createTranslator((key, fallback) =>
        key === 'document.label' ? 'Име на документа' : fallback,
      ),
    },
  });
  expect(view.container.querySelector('thead')?.textContent).toContain('Име на документа');
  await view.rerender({
    i18n: {
      locale: 'bg',
      translate: createTranslator((key, fallback) => (key === 'document.label' ? '' : fallback)),
    },
  });
  expect(view.container.querySelector('thead')?.textContent).not.toContain('Document name');
  expect(view.container.querySelector('thead')?.textContent).not.toContain('Име на документа');
});
