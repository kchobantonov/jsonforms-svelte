import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { shadcnCells, shadcnRenderers } from '@chobantonov/jsonforms-svelte-shadcn';
import { shadcnExtendedCells, shadcnExtendedRenderers } from '../src/lib';
import { afterEach, expect, it } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import './test.css';

afterEach(cleanup);

it('renders and refreshes a gated Markdown Label summary in a normal table', async () => {
  const config = (enabled: boolean) => ({
    jsonformsExtended: { dynamicValues: { enabled } },
  });
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'object',
        properties: {
          rows: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                city: { type: 'string' },
              },
            },
          },
        },
      },
      data: { rows: [{ name: 'Alice', city: 'Boston' }] },
      config: config(true),
      uischema: {
        type: 'Control',
        scope: '#/properties/rows',
        options: {
          table: true,
          columnDefs: [{ field: 'preview', scope: '#' }],
          cells: {
            preview: {
              summary: {
                type: 'Label',
                i18n: 'preview',
                text: '**{name}** / {city}',
                options: {
                  markup: 'markdown',
                  interpolate: true,
                  textParams: { name: '{item.name}', city: '{item.city}' },
                },
              },
            },
          },
        },
      },
      renderers: [...shadcnExtendedRenderers, ...shadcnRenderers],
      cells: [...shadcnExtendedCells, ...shadcnCells],
    },
  });

  const summary = () => view.container.querySelector('[data-composite-summary]');
  await expect.poll(() => summary()?.querySelector('strong')?.textContent).toBe('Alice');
  expect(summary()?.textContent).toContain('Boston');
  expect(summary()?.closest('td')?.querySelector('button')).toBeNull();

  await view.rerender({ config: config(false) });
  await expect.poll(() => summary()?.textContent?.includes('Alice')).toBe(false);
  expect(summary()?.textContent).not.toContain('Boston');
  await expect
    .poll(() => summary()?.querySelector('[data-markup-diagnostic="interpolationFailed"]'))
    .not.toBeNull();

  await view.rerender({
    data: { rows: [{ name: 'Bob', city: 'Oslo' }] },
    config: config(true),
    i18n: {
      locale: 'bg',
      translate: (key: string, fallback: string | undefined) =>
        key === 'preview.text' ? '**{name}** от {city}' : (fallback ?? key),
    },
  });
  await expect.poll(() => summary()?.querySelector('strong')?.textContent).toBe('Bob');
  expect(summary()?.textContent).toContain('от Oslo');

  await view.rerender({
    config: {
      jsonformsExtended: {
        dynamicValues: { enabled: true },
        markup: { markdown: { enabled: false } },
      },
    },
  });
  await expect.poll(() => summary()?.textContent?.includes('**Bob** от Oslo')).toBe(true);
  expect(summary()?.querySelector('strong')).toBeNull();
  expect(summary()?.querySelector('[role="alert"]')).toBeNull();

  await view.rerender({
    config: config(true),
    i18n: {
      locale: 'bg',
      translate: (key: string, fallback: string | undefined) =>
        key === 'preview.text' ? '[Сайт](javascript:alert%281%29) — **{name}**' : (fallback ?? key),
    },
  });
  await expect.poll(() => summary()?.textContent?.includes('Сайт — Bob')).toBe(true);
  expect(summary()?.querySelector('a')).toBeNull();
  expect(summary()?.querySelector('[role="alert"]')).toBeNull();
});
