import { JsonForms } from '@chobantonov/jsonforms-svelte';
import type { UISchemaElement } from '@jsonforms/core';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import { markupLabelRendererEntry } from '../../src/lib/layouts';

vi.mock('../../src/lib/presentation/loaders', () => ({
  loadMarkdown: () => Promise.reject(new Error('Unavailable Markdown chunk')),
  loadInterpolation: () => Promise.reject(new Error('Unavailable evaluator chunk')),
}));
afterEach(cleanup);

it('keeps Markdown source readable when its lazy chunk fails', async () => {
  const view = await render(JsonForms, {
    props: {
      data: {},
      schema: {},
      renderers: [markupLabelRendererEntry],
      uischema: {
        type: 'Label',
        text: '**Important**',
        options: { markup: 'markdown' },
      } as UISchemaElement,
    },
  });
  await expect
    .poll(() => view.container.querySelector('[data-markup-diagnostic="loadFailed"]')?.textContent)
    .toContain('Markdown could not be loaded');
  expect(view.container.textContent).toContain('**Important**');
});
it('keeps literal text without leaking unresolved expressions when the evaluator fails', async () => {
  const view = await render(JsonForms, {
    props: {
      data: {},
      schema: {},
      renderers: [markupLabelRendererEntry],
      i18n: { locale: 'bg' },
      uischema: {
        type: 'Label',
        text: 'Hello {name}',
        options: { interpolate: true, textParams: { name: 'Ana' } },
      } as UISchemaElement,
    },
  });
  await expect
    .poll(
      () =>
        view.container.querySelector('[data-markup-diagnostic="interpolationFailed"]')?.textContent,
    )
    .toContain('Изразите в текста');
  expect(view.container.textContent).toContain('Hello');
  expect(view.container.textContent).not.toContain('{name}');
});
