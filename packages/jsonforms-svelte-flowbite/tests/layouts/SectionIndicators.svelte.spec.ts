import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { flowbiteRenderers, flowbiteCells } from '../../src/lib';
import { cleanup, render } from 'vitest-browser-svelte';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/browser';
import type { UISchemaElement } from '@jsonforms/core';
import messages from '../../../jsonforms-svelte/src/lib/locales/messages.json';
afterEach(cleanup);
it('shows a Category error cue before touch while delaying inline feedback', async () => {
  const view = await render(JsonForms, {
    props: {
      schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' } } },
      uischema: {
        type: 'Categorization',
        elements: [
          {
            type: 'Category',
            label: 'Name',
            options: { showValidationIndicator: true },
            elements: [{ type: 'Control', scope: '#/properties/name' }],
          },
        ],
      },
      data: {},
      config: {
        enableFilterErrorsBeforeTouch: true,
        filterErrorKeywordsBeforeTouch: ['required'],
      },
      renderers: flowbiteRenderers,
      cells: flowbiteCells,
    },
  });
  await expect
    .poll(() => view.container.querySelector('[data-container-validation-indicator]'))
    .not.toBeNull();
  const alert = () => view.container.querySelector('p[role="alert"]') !== null;
  expect(alert()).toBe(false);
  const input = page.getByRole('textbox', { name: 'Name' });
  await input.click();
  await userEvent.tab();
  await expect.poll(alert).toBe(true);
  await expect
    .poll(() => view.container.querySelector('[data-container-validation-indicator]'))
    .not.toBeNull();
});

it('keeps a row Group disclosure with its occurrence after moving the row', async () => {
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'object',
        properties: {
          rows: {
            type: 'array',
            items: { type: 'object', properties: { name: { type: 'string' } } },
          },
        },
      },
      uischema: {
        type: 'Control',
        scope: '#/properties/rows',
        options: {
          showSortButtons: true,
          table: false,
          detail: {
            type: 'Group',
            label: 'Row',
            options: { collapsible: true },
            elements: [{ type: 'Control', scope: '#/properties/name' }],
          },
        },
      },
      data: { rows: [{ name: 'first' }, { name: 'second' }] },
      renderers: flowbiteRenderers,
      cells: flowbiteCells,
      onchange,
    },
  });
  const groups = () => [...view.container.querySelectorAll<HTMLElement>('[data-group-frame]')];
  await expect.poll(() => groups().length).toBe(1);
  const disclosure = () => groups()[0].querySelector<HTMLButtonElement>('button[aria-expanded]')!;
  const triggers = () => [
    ...view.container.querySelectorAll<HTMLButtonElement>(
      'button[aria-expanded]:not([aria-haspopup])',
    ),
  ];
  expect(groups()[0].querySelector<HTMLInputElement>('input')?.value).toBe('first');
  await userEvent.click(disclosure());
  await expect.poll(() => disclosure().getAttribute('aria-expanded')).toBe('false');
  const down = [...view.container.querySelectorAll<HTMLButtonElement>('button')].find(
    (button) => button.getAttribute('aria-label') === messages.en['array.downAriaLabel'],
  )!;
  await userEvent.click(down);
  await expect.poll(() => onchange.mock.lastCall?.[0].data.rows[1].name).toBe('first');
  expect(disclosure().getAttribute('aria-expanded')).toBe('false');
  await userEvent.click(disclosure());
  await expect
    .poll(() => groups()[0].querySelector<HTMLInputElement>('input')?.value)
    .toBe('first');
  await userEvent.click(disclosure());
  triggers()[0]!.click();
  await expect
    .poll(() => groups()[0].querySelector<HTMLInputElement>('input')?.value)
    .toBe('second');
  expect(disclosure().getAttribute('aria-expanded')).toBe('true');
});
it('keeps the section count independent of field touch while host errors change', async () => {
  const view = await render(JsonForms, {
    props: {
      schema: { type: 'object', properties: { name: { type: 'string', minLength: 3 } } },
      uischema: {
        type: 'Group',
        label: 'Section',
        elements: [{ type: 'Control', scope: '#/properties/name' }],
      },
      data: { name: 'x' },
      config: {
        enableFilterErrorsBeforeTouch: true,
        filterErrorKeywordsBeforeTouch: ['minLength'],
        jsonformsExtended: { showValidationIndicator: true, showValidationIndicatorCount: true },
      },
      renderers: flowbiteRenderers,
      cells: flowbiteCells,
    },
  });
  const one = messages.en['validation.containerError'].replace('{count}', '1');
  const two = messages.en['validation.containerErrors'].replace('{count}', '2');
  await expect.element(page.getByRole('img', { name: one, exact: true })).toBeVisible();
  await view.rerender({
    additionalErrors: [
      {
        instancePath: '/name',
        schemaPath: '#/host',
        keyword: 'host',
        params: {},
        message: 'Host error',
      },
    ],
  });
  await expect.element(page.getByRole('img', { name: two, exact: true })).toBeVisible();
  const input = page.getByRole('textbox');
  await input.click();
  await userEvent.tab();
  await expect.element(page.getByRole('img', { name: two, exact: true })).toBeVisible();
});

it.each(['en', 'bg'] as const)(
  'keeps scoped counts and host errors visible in %s while collapsed',
  async (locale) => {
    const uischema = {
      type: 'Group',
      label: 'Section',
      options: { collapsible: true, collapsed: true },
      elements: [
        { type: 'Control', scope: '#/properties/name' },
        { type: 'Control', scope: '#/properties/name' },
      ],
    } as UISchemaElement;
    const view = await render(JsonForms, {
      props: {
        schema: { type: 'object', properties: { name: { type: 'string', minLength: 2 } } },
        uischema,
        data: { name: '' },
        i18n: { locale },
        config: {
          jsonformsExtended: { showValidationIndicator: true, showValidationIndicatorCount: true },
        },
        renderers: flowbiteRenderers,
        cells: flowbiteCells,
      },
    });
    const one = messages[locale]['validation.containerError'].replace('{count}', '1');
    const two = messages[locale]['validation.containerErrors'].replace('{count}', '2');
    await expect.element(page.getByRole('img', { name: one, exact: true })).toBeVisible();
    const marker = page.getByRole('img', { name: one, exact: true });
    await marker.click();
    await expect.element(page.getByRole('dialog')).toMatchTextContent(one);
    expect(
      view.container.querySelector('button[aria-expanded]')?.getAttribute('aria-expanded'),
    ).toBe('false');
    await userEvent.keyboard('{Escape}');
    await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
    await userEvent.keyboard('{Enter}');
    await expect.element(page.getByRole('dialog')).toMatchTextContent(one);
    await userEvent.keyboard('{Escape}');
    await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
    await marker.click();
    await expect.element(page.getByRole('dialog')).toMatchTextContent(one);
    await userEvent.keyboard('{Escape}');
    await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();

    await view.rerender({
      additionalErrors: [
        {
          instancePath: '/name',
          schemaPath: '#/host',
          keyword: 'host',
          params: {},
          message: 'Host error',
        },
      ],
    });
    await expect.element(page.getByRole('img', { name: two, exact: true })).toBeVisible();
    await view.rerender({ validationMode: 'ValidateAndHide' });
    await expect.element(page.getByRole('img', { name: one, exact: true })).toBeVisible();
    await view.rerender({
      uischema: { ...uischema, options: { ...uischema.options, showValidationIndicator: false } },
    });
    expect(page.getByRole('img', { name: one, exact: true }).query()).toBeNull();
  },
);

it.each(['en', 'bg'] as const)(
  'shows one structured entry per hidden section error in %s',
  async (locale) => {
    const properties = Object.fromEntries(
      Array.from({ length: 5 }, (_, index) => [
        `field${index + 1}`,
        { type: 'string', minLength: 2, title: `Field ${index + 1}` },
      ]),
    );
    await render(JsonForms, {
      props: {
        schema: { type: 'object', properties },
        uischema: {
          type: 'Group',
          label: 'Section',
          options: { collapsible: true, collapsed: true },
          elements: Object.keys(properties).map((key) => ({
            type: 'Control',
            scope: `#/properties/${key}`,
          })),
        },
        data: Object.fromEntries(Object.keys(properties).map((key) => [key, 'x'])),
        i18n: { locale },
        config: {
          jsonformsExtended: { showValidationIndicator: true, showValidationIndicatorCount: true },
        },
        renderers: flowbiteRenderers,
        cells: flowbiteCells,
      },
    });
    const count = messages[locale]['validation.containerErrors'].replace('{count}', '5');
    await page.getByRole('img', { name: count, exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect.element(dialog).toMatchTextContent('Field 1');
    expect(dialog.query()?.querySelectorAll('li')).toHaveLength(3);
    await dialog
      .getByRole('button', {
        name: messages[locale]['validation.showMore'].replace('{count}', '2'),
      })
      .click();
    await expect.element(dialog).toMatchTextContent('Field 5');
    expect(dialog.query()?.querySelectorAll('li')).toHaveLength(5);
    await dialog.getByRole('button', { name: messages[locale]['validation.showLess'] }).click();
    expect(dialog.query()?.querySelectorAll('li')).toHaveLength(3);
  },
);
