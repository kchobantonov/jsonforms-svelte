import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { createTranslator, type UISchemaElement } from '@jsonforms/core';
import { afterEach, expect, it } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';
import { markupLabelRendererEntry } from '../../src/lib/layouts';

afterEach(cleanup);
const dynamic = { jsonformsExtended: { dynamicValues: { enabled: true } } };
const mount = (text: string, textParams = {}, config = {}, data = {}, markdown = false) =>
  render(JsonForms, {
    props: {
      schema: { type: 'object' },
      data,
      config,
      uischema: {
        type: 'Label',
        text,
        options: { interpolate: true, textParams, markup: markdown ? 'markdown' : 'plain' },
      } as UISchemaElement,
      renderers: [markupLabelRendererEntry],
    },
  });

it('uses static parameters and expressions with dynamic resolution disabled', async () => {
  const view = mount('Hello {name}, {seats == 1 ? "seat" : "seats"}', { name: 'Ana', seats: 2 });
  await expect.poll(() => view.container.textContent?.trim()).toBe('Hello Ana, seats');
  expect(view.container.querySelector('[role="alert"]')).toBeNull();
});
it('unescapes literal braces without evaluating their contents', () => {
  const view = mount('{{data.secret}}');
  expect(view.container.textContent?.trim()).toBe('{data.secret}');
  expect(view.container.querySelector('[role="status"]')).toBeNull();
});
it('withholds dynamic namespaces until enabled', async () => {
  const view = mount('Hello {name}', { name: '{data.secret}' }, {}, { secret: 'Hidden' });
  await expect.poll(() => view.container.querySelector('[data-markup-diagnostic]')).not.toBeNull();
  expect(view.container.textContent?.trim()).not.toContain('Hidden');
  await view.rerender({ config: dynamic });
  await expect.poll(() => view.container.textContent?.trim()).toBe('Hello Hidden');
});
it('keeps data paths out of text even with the dynamic gate open', async () => {
  const view = mount('Value {data.secret}', {}, dynamic, { secret: 'Hidden' });
  await expect.poll(() => view.container.querySelector('[data-markup-diagnostic]')).not.toBeNull();
  expect(view.container.textContent?.trim()).not.toContain('Hidden');
  expect(view.container.textContent?.trim()).not.toContain('{data.secret}');
});
it('reacts to replacement data and silently renders missing optional data as empty', async () => {
  const view = mount('Hello {name}', { name: '{data.name}' }, dynamic, { name: 'Ana' });
  await expect.poll(() => view.container.textContent?.trim()).toBe('Hello Ana');
  await view.rerender({ data: {} });
  await expect.poll(() => view.container.textContent?.trim()).toBe('Hello');
  expect(view.container.querySelector('[role="alert"]')).toBeNull();
});
it('escapes substitutions while retaining author Markdown', async () => {
  const view = mount(
    '**Author** {value}',
    { value: '[Click](https://example.com) **value** <img src=x>' },
    {},
    {},
    true,
  );
  await expect.poll(() => view.container.querySelector('strong')?.textContent).toBe('Author');
  expect(view.container.querySelectorAll('strong')).toHaveLength(1);
  expect(view.container.querySelector('a, img')).toBeNull();
  expect(view.container.textContent?.trim()).toContain(
    '[Click](https://example.com) **value** <img src=x>',
  );
});
it('translates the text and formats parameters when the locale changes', async () => {
  const view = mount('Total: {amount}', { amount: '{currency(data.price, "EUR")}' }, dynamic, {
    price: 12.5,
  });
  await expect
    .poll(() => view.container.textContent?.trim())
    .toContain(new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR' }).format(12.5));
  await view.rerender({
    i18n: {
      locale: 'bg',
      translate: createTranslator((_key, fallback) =>
        fallback === 'Total: {amount}' ? 'Общо: {amount}' : fallback,
      ),
    },
  });
  await expect
    .poll(() => view.container.textContent?.trim())
    .toBe(
      'Общо: ' + new Intl.NumberFormat('bg', { style: 'currency', currency: 'EUR' }).format(12.5),
    );
});
it('localizes failed expressions in Bulgarian', async () => {
  const view = mount('{unknown}');
  await view.rerender({ i18n: { locale: 'bg' } });
  await expect
    .poll(() => view.container.querySelector('[role="alert"]')?.textContent)
    .toContain('Неуспешно изчисляване');
});
it('does not evaluate parameters when interpolation is disabled', async () => {
  const view = mount('{name}', { name: '{data.secret}' }, dynamic, { secret: 'Hidden' });
  await view.rerender({
    uischema: {
      type: 'Label',
      text: '{name}',
      options: { markup: 'markdown', textParams: { name: '{data.secret}' } },
    } as UISchemaElement,
  });
  await expect.poll(() => view.container.textContent?.trim()).toBe('{name}');
  expect(view.container.querySelector('[role="alert"]')).toBeNull();
});
