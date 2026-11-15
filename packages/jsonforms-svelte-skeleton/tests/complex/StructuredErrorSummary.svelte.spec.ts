import '../test.css';
import { createTranslator } from '@jsonforms/core';
import { entry as layout } from '../../src/lib/layouts/ArrayLayoutRenderer.entry';
import { entry as table } from '../../src/lib/complex/ArrayControlRenderer.entry';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import { cleanup, render } from 'vitest-browser-svelte';
import { skeletonRenderers, skeletonCells } from '../../src/lib';
import messages from '../../../jsonforms-svelte/src/lib/locales/messages.json';

afterEach(cleanup);
it.each(['en', 'bg'] as const)(
  'shows a short array notice and keeps field errors on their cells in %s',
  async (locale) => {
    const onchange = vi.fn();
    const data = Array.from({ length: 7 }, () => ({ message: 'x' }));
    const view = await render(JsonForms, {
      props: {
        schema: {
          type: 'array',
          items: {
            type: 'object',
            properties: { message: { type: 'string', minLength: 3, title: 'Message' } },
          },
        },
        uischema: {
          type: 'Control',
          scope: '#',
          options: { table: true },
        },
        data,
        renderers: [
          ...skeletonRenderers,
          {
            ...table,
            tester: (ui, schema) =>
              ui.type === 'Control' && 'scope' in ui && ui.scope === '#' && schema.type === 'array'
                ? 100
                : -1,
          },
        ],
        cells: skeletonCells,
        i18n: {
          locale,
          translate: createTranslator((key, fallback) =>
            key.endsWith('.label') ? 'Translated field' : fallback,
          ),
        },
        onchange,
      },
    });
    const notice = view.container.querySelector<HTMLElement>('[data-array-summary]')!;
    expect(notice.querySelector('[data-array-summary-message]')?.textContent?.trim()).toBe(
      messages[locale]['validation.childrenErrors'],
    );
    expect(notice.textContent).not.toContain('Translated field');
    expect(notice.querySelector('button')?.textContent?.trim()).toBe(
      messages[locale]['collection.firstError'],
    );
    expect(view.container.querySelector('[data-array-own-errors]')).toBeNull();
    const pageTwo = messages[locale]['collection.errorPage']
      .replace('{page}', '2')
      .replace('{count}', '2');
    onchange.mockClear();
    await page.getByRole('button', { name: pageTwo, exact: true }).click();
    expect(view.container.querySelectorAll('tbody tr')).toHaveLength(2);
    await page.getByRole('button', { name: messages[locale]['collection.firstError'] }).click();
    expect(view.container.querySelectorAll('tbody tr')).toHaveLength(5);
    expect(onchange).not.toHaveBeenCalled();
  },
);

it('retranslates a host-error child notice on a locale-only change without editing data', async () => {
  const data = [{ name: 'Ada' }];
  const additionalErrors = [
    {
      instancePath: '/0/name',
      schemaPath: '#/host',
      keyword: 'host',
      params: {},
      message: 'Host error',
    },
  ];
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: { type: 'object', properties: { name: { type: 'string', title: 'Name' } } },
      },
      uischema: {
        type: 'Control',
        scope: '#',
        options: { table: true },
      },
      data,
      additionalErrors,
      renderers: [
        ...skeletonRenderers,
        {
          ...table,
          tester: (ui, schema) =>
            ui.type === 'Control' && 'scope' in ui && ui.scope === '#' && schema.type === 'array'
              ? 100
              : -1,
        },
      ],
      cells: skeletonCells,
      i18n: { locale: 'en', translateError: () => 'Host English' },
    },
  });
  const notice = view.container.querySelector<HTMLElement>('[data-array-summary]')!;
  expect(notice.querySelector('[data-array-summary-message]')?.textContent?.trim()).toBe(
    messages.en['validation.childrenErrors'],
  );
  expect(notice.textContent).not.toContain('Host English');
  await view.rerender({ i18n: { locale: 'bg', translateError: () => 'Грешка от сървъра' } });
  await vi.waitFor(() =>
    expect(notice.querySelector('[data-array-summary-message]')?.textContent?.trim()).toBe(
      messages.bg['validation.childrenErrors'],
    ),
  );
  expect(data).toEqual([{ name: 'Ada' }]);
});

it('opens a row summary independently of its accordion header', async () => {
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: { name: { type: 'string', minLength: 3, title: 'Name' } },
        },
      },
      uischema: { type: 'Control', scope: '#' },
      data: [{ name: 'x' }],
      renderers: [
        ...skeletonRenderers,
        {
          ...layout,
          tester: (ui, schema) =>
            ui.type === 'Control' && 'scope' in ui && ui.scope === '#' && schema.type === 'array'
              ? 100
              : -1,
        },
      ],
      cells: skeletonCells,
      onchange,
    },
  });
  const indicator = view.container.querySelector<HTMLElement>('[data-row-summary]')!;
  const trigger =
    indicator.tagName === 'BUTTON'
      ? indicator
      : indicator.querySelector<HTMLButtonElement>('button')!;
  expect(trigger.parentElement?.closest('button')).toBeNull();
  const expanded = () =>
    Array.from(view.container.querySelectorAll('button[aria-expanded]'))
      .filter((button) => button !== trigger)
      .map((button) => button.getAttribute('aria-expanded'));
  const before = expanded();
  onchange.mockClear();
  await page.elementLocator(trigger).click();
  await vi.waitFor(() => {
    const visible = Array.from(
      document.querySelectorAll<HTMLElement>('[data-error-summary]'),
    ).filter((element) => element.checkVisibility({ checkVisibilityCSS: true }));
    expect(visible).toHaveLength(1);
    expect(visible[0].textContent).toContain('1 / Name:');
  });
  expect(expanded()).toEqual(before);
  expect(onchange).not.toHaveBeenCalled();
});
