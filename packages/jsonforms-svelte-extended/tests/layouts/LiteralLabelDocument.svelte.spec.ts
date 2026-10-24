import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { createTranslator } from '@jsonforms/core';
import { afterEach, expect, it } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import { markupLabelRendererEntry } from '../../src/lib/layouts';
import LiteralLabelHost from '../fixtures/LiteralLabelHost.svelte';
afterEach(cleanup);
it('uses the isolated form and nearest row for visible labels and search', async () => {
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'object',
        properties: {
          heading: { type: 'string' },
          'a.b': {
            type: 'array',
            items: {
              type: 'object',
              properties: { name: { type: 'string' }, heading: { type: 'string' } },
            },
          },
        },
      },
      data: { heading: 'Outer', 'a.b': [{ name: 'Alice', heading: 'Applicants' }] },
      config: { jsonformsExtended: { dynamicValues: { enabled: true } } },
      uischema: { type: 'Control', scope: '#/properties/a.b' },
      renderers: [
        markupLabelRendererEntry,
        { tester: (ui) => (ui.type === 'Control' ? 100 : -1), renderer: LiteralLabelHost },
      ],
    },
  });
  const visible = () =>
    view.container.querySelector('[data-testid="visible-label"]')?.textContent?.trim();
  const search = () => view.container.querySelector('[data-testid="search-text"]')?.textContent;
  await expect.poll(visible).toBe('Alice · Applicants');
  await expect.poll(search).toBe('Alice · Applicants');
  await view.rerender({
    data: { heading: 'Outer', 'a.b': [{ name: 'Ана', heading: 'Кандидати' }] },
    i18n: {
      locale: 'bg',
      translate: createTranslator((key, fallback) =>
        key === 'summary.text' ? '{heading}: {name}' : fallback,
      ),
    },
  });
  await expect.poll(visible).toBe('Кандидати: Ана');
  await expect.poll(search).toBe('Кандидати: Ана');
  expect(view.container.querySelector('[role="alert"]')).toBeNull();
});
