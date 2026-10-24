import { JsonForms, type JsonFormsValidityEvent } from '@chobantonov/jsonforms-svelte';
import { skeletonRenderers, skeletonCells } from '@chobantonov/jsonforms-svelte-skeleton';
import { skeletonExtendedRenderers, skeletonExtendedCells } from '../../src/lib';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/browser';
import { cleanup, render } from 'vitest-browser-svelte';

afterEach(cleanup);

it('localizes real Monaco actions and keeps invalid converted JSON out of committed data', async () => {
  const changes = vi.fn();
  const validity = vi.fn<(event: JsonFormsValidityEvent) => void>();
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'object',
        properties: { payload: { type: 'object', properties: { name: { type: 'string' } } } },
      },
      data: { payload: { name: 'original' } },
      uischema: {
        type: 'Control',
        scope: '#/properties/payload',
        label: 'Payload',
        options: {
          format: 'code',
          language: 'json',
          convertJson: true,
          monaco: { options: { autoClosingBrackets: 'never', autoClosingQuotes: 'never' } },
        },
      },
      config: { propagateErrors: false, jsonformsExtended: { propagateErrors: true } },
      i18n: { locale: 'bg' },
      renderers: [...skeletonRenderers, ...skeletonExtendedRenderers],
      cells: [...skeletonCells, ...skeletonExtendedCells],
      onchange: changes,
      onvaliditychange: validity,
    },
  });
  await expect
    .element(page.getByRole('button', { name: 'Разгъване на редактора на код' }))
    .toBeVisible();
  const input = page.getByRole('textbox', { name: 'Payload' });
  await vi.waitFor(() => expect(input.element()).toBeDefined(), { timeout: 10000 });
  const replaceText = async (text: string) => {
    (input.element() as HTMLElement).focus();
    const modifier = navigator.platform.includes('Mac') ? 'Meta' : 'Control';
    await userEvent.keyboard(`{${modifier}>}a{/${modifier}}{Backspace}`);
    await userEvent.keyboard(text.replaceAll('{', '{{').replaceAll('[', '[['));
  };
  await replaceText('{ broken');
  await vi.waitFor(() => expect(validity.mock.lastCall?.[0].additionalErrors).toHaveLength(1));
  expect(changes.mock.lastCall?.[0].data).toEqual({ payload: { name: 'original' } });
  expect(validity.mock.lastCall?.[0].additionalErrors[0].instancePath).toBe('/payload');
  expect(validity.mock.lastCall?.[0].additionalErrors[0].message).toBe('Невалиден JSON');
  await view.rerender({
    config: { propagateErrors: true, jsonformsExtended: { propagateErrors: false } },
  });
  await vi.waitFor(() => expect(validity.mock.lastCall?.[0].additionalErrors).toEqual([]));
  expect(view.container.querySelector('.view-lines')?.textContent).toContain('broken');
  await view.rerender({ config: { jsonformsExtended: { propagateErrors: true } } });
  await vi.waitFor(() => expect(validity.mock.lastCall?.[0].additionalErrors).toHaveLength(1));

  await view.rerender({
    additionalErrors: [
      {
        keyword: 'server',
        instancePath: '/payload',
        schemaPath: '',
        params: {},
        message: 'Server says no',
      },
    ],
  });
  await vi.waitFor(() => expect(validity.mock.lastCall?.[0].additionalErrors).toHaveLength(2));
  expect(view.container.textContent).toContain('Server says no');
  await view.rerender({ additionalErrors: [] });
  await userEvent.keyboard('{Escape}');
  await page.getByRole('button', { name: 'Разгъване на редактора на код' }).click();
  await expect
    .element(page.getByRole('button', { name: 'Възстановяване на редактора на код' }))
    .toBeVisible();
  await page.getByRole('button', { name: 'Възстановяване на редактора на код' }).click();
  await replaceText('{"name":"edited"}');
  await vi.waitFor(() =>
    expect(changes.mock.lastCall?.[0].data).toEqual({ payload: { name: 'edited' } }),
  );
  await vi.waitFor(() => expect(validity.mock.lastCall?.[0].valid).toBe(true));
  await replaceText('null');
  await vi.waitFor(() => expect(changes.mock.lastCall?.[0].data).toEqual({ payload: null }));
  await vi.waitFor(() =>
    expect(view.container.querySelector('.view-lines')?.textContent).toContain('null'),
  );
  expect(validity.mock.lastCall?.[0].additionalErrors).toEqual([]);
  expect(validity.mock.lastCall?.[0].valid).toBe(false);
  await view.rerender({ i18n: { locale: 'en' } });
  await expect.element(page.getByRole('button', { name: 'Maximize code editor' })).toBeVisible();
});

it('edits mixed code as a whole JSON value and owns invalid drafts', async () => {
  const changes = vi.fn();
  const validity = vi.fn<(event: JsonFormsValidityEvent) => void>();
  const view = await render(JsonForms, {
    props: {
      schema: { type: ['string', 'object', 'null'] },
      data: 'original',
      uischema: {
        type: 'Control',
        scope: '#',
        label: 'Mixed payload',
        options: {
          monaco: { options: { autoClosingBrackets: 'never', autoClosingQuotes: 'never' } },
        },
      },
      config: {
        propagateErrors: false,
        jsonformsExtended: { mixed: { structuredLayout: 'code' } },
      },
      renderers: [...skeletonRenderers, ...skeletonExtendedRenderers],
      cells: [...skeletonCells, ...skeletonExtendedCells],
      onchange: changes,
      onvaliditychange: validity,
    },
  });
  const input = page.getByRole('textbox', { name: 'Mixed payload', exact: true });
  await vi.waitFor(() => expect(input.element()).toBeDefined(), { timeout: 10000 });
  expect(view.container.querySelector('[id$="-input-selector"]')).toBeNull();
  const replaceText = async (text: string) => {
    (input.element() as HTMLElement).focus();
    const modifier = navigator.platform.includes('Mac') ? 'Meta' : 'Control';
    await userEvent.keyboard(`{${modifier}>}a{/${modifier}}{Backspace}`);
    await userEvent.keyboard(text.replaceAll('{', '{{').replaceAll('[', '[['));
  };
  await replaceText('{ broken');
  await vi.waitFor(() => expect(validity.mock.lastCall?.[0].additionalErrors).toHaveLength(1));
  expect(changes.mock.lastCall?.[0].data).toBe('original');
  expect(validity.mock.lastCall?.[0].additionalErrors[0].instancePath).toBe('');
  await replaceText('null');
  await vi.waitFor(() => expect(changes.mock.lastCall?.[0].data).toBeNull());
  await vi.waitFor(() => expect(validity.mock.lastCall?.[0].additionalErrors).toHaveLength(0));
  await replaceText('{ broken');
  await vi.waitFor(() => expect(validity.mock.lastCall?.[0].additionalErrors).toHaveLength(1));
  await view.rerender({
    uischema: {
      type: 'Control',
      scope: '#',
      label: 'Mixed payload',
      options: { structuredLayout: 'tree' },
    },
  });
  await vi.waitFor(() => expect(view.container.querySelector('.monaco-editor')).toBeNull());
  await vi.waitFor(() => expect(validity.mock.lastCall?.[0].additionalErrors).toHaveLength(0));
  expect(changes.mock.lastCall?.[0].data).toBeNull();
});
