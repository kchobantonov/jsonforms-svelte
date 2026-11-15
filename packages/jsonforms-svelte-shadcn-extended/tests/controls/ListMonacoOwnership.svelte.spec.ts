import type { UISchemaElement } from '@jsonforms/core';
import { JsonForms, type JsonFormsValidityEvent } from '@chobantonov/jsonforms-svelte';
import { shadcnRenderers, shadcnCells } from '@chobantonov/jsonforms-svelte-shadcn';
import { shadcnExtendedRenderers, shadcnExtendedCells } from '../../src/lib';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import messages from '../../../jsonforms-svelte/src/lib/locales/messages.json';

afterEach(cleanup);
it.each(['en', 'bg'] as const)(
  'moves and disposes native list Monaco ownership in %s',
  async (locale) => {
    const { monaco } =
      await import('../../../jsonforms-svelte-extended/src/lib/components/monaco-api.js');
    const validity = vi.fn<(event: JsonFormsValidityEvent) => void>();
    const changes = vi.fn();
    const host = {
      keyword: 'server',
      instancePath: '/host',
      schemaPath: '',
      params: {},
      message: 'Keep server error',
    };
    const view = await render(JsonForms, {
      props: {
        schema: {
          type: 'object',
          properties: { rows: { type: 'array', items: { type: 'string' } } },
        },
        data: { rows: ['{ invalid', '{ invalid'], sibling: 'keep' },
        uischema: {
          type: 'ListWithDetail',
          scope: '#/properties/rows',
          options: {
            showSortButtons: true,
            confirmation: { delete: 'never' },
            detail: {
              type: 'Control',
              scope: '#',
              options: { format: 'code', language: 'json', propagateErrors: true },
            },
          },
        } as UISchemaElement,
        i18n: { locale },
        renderers: [...shadcnRenderers, ...shadcnExtendedRenderers],
        cells: [...shadcnCells, ...shadcnExtendedCells],
        additionalErrors: [host],
        onvaliditychange: validity,
        onchange: changes,
      },
    });
    const items = [
      ...view.container.querySelectorAll<HTMLElement>('[role="option"], button[aria-current]'),
    ];
    items[1].click();
    const expectErrorAt = async (path: string) =>
      vi.waitFor(
        () => {
          expect(validity.mock.lastCall?.[0]).toMatchObject({ pending: false, valid: false });
          expect(validity.mock.lastCall?.[0].additionalErrors).toEqual([
            host,
            expect.objectContaining({ keyword: 'editor', instancePath: path }),
          ]);
        },
        { timeout: 10000 },
      );
    await expectErrorAt('/rows/1');
    const model = monaco.editor.getModels().find((model) => model.getValue() === '{ invalid')!;
    const editor = monaco.editor.getEditors().find((editor) => editor.getModel() === model)!;
    const command = (action: 'up' | 'remove', index: number) => {
      const buttons = [...view.container.querySelectorAll<HTMLButtonElement>('button')].filter(
        (button) =>
          button.getAttribute('aria-label') === messages[locale][`array.${action}AriaLabel`],
      );
      expect(buttons[index]).toBeTruthy();
      buttons[index].click();
    };
    command('up', 1);
    await expectErrorAt('/rows/0');
    expect(editor.getModel()).toBe(model);
    expect(model.isDisposed()).toBe(false);
    command('remove', 1);
    await vi.waitFor(() => expect(changes.mock.lastCall?.[0].data.rows).toHaveLength(1));
    await expectErrorAt('/rows/0');
    expect(editor.getModel()).toBe(model);
    command('remove', 0);
    await vi.waitFor(() => expect(validity.mock.lastCall?.[0].additionalErrors).toEqual([host]));
    expect(model.isDisposed()).toBe(true);
    expect(view.container.querySelector('.monaco-editor')).toBeNull();
    expect(changes.mock.lastCall?.[0].data).toEqual({ rows: [], sibling: 'keep' });
  },
);
