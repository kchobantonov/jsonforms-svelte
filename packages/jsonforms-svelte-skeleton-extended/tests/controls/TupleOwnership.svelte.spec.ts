import { JsonForms, type JsonFormsValidityEvent } from '@chobantonov/jsonforms-svelte';
import { skeletonRenderers, skeletonCells } from '@chobantonov/jsonforms-svelte-skeleton';
import { skeletonExtendedRenderers, skeletonExtendedCells } from '../../src/lib';
import type { JsonSchema } from '@jsonforms/core';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import messages from '../../../jsonforms-svelte/src/lib/locales/messages.json';

afterEach(cleanup);
it.each(
  (['en', 'bg'] as const).flatMap((locale) =>
    ['value', 'value.key'].map((field) => ({ locale, field })),
  ),
)(
  'retains duplicate tuple-tail file ownership through edit, add and removal at $field in $locale',
  async ({ locale, field }) => {
    const validity = vi.fn<(event: JsonFormsValidityEvent) => void>();
    const changes = vi.fn();
    const host = {
      instancePath: '/' + field + '/2',
      keyword: 'server',
      schemaPath: '',
      params: {},
      message: 'Keep host path',
    };
    const view = await render(JsonForms, {
      props: {
        schema: {
          type: 'object',
          properties: {
            [field]: {
              type: 'array',
              items: [{ type: 'string', title: 'Code' }],
              additionalItems: { type: 'string', format: 'byte' },
            },
          },
        } as JsonSchema,
        uischema: {
          type: 'Control',
          scope: '#/properties/' + field,
          options: { confirmation: { delete: 'never' } },
        },
        data: { [field]: ['fixed', 'aGVsbG8=', ''], sibling: 'keep' },
        config: { formatMaximum: 2, restrict: false },
        i18n: { locale },
        renderers: [...skeletonExtendedRenderers, ...skeletonRenderers],
        cells: [...skeletonExtendedCells, ...skeletonCells],
        additionalErrors: [host],
        onvaliditychange: validity,
        onchange: changes,
      },
    });
    const inputs = () => [
      ...view.container.querySelectorAll<HTMLInputElement>(
        '[data-file-control] input[type="file"]',
      ),
    ];
    const original = inputs()[1];
    const transfer = new DataTransfer();
    transfer.items.add(new File(['hello'], 'large.txt'));
    original.files = transfer.files;
    original.dispatchEvent(new Event('change', { bubbles: true }));
    const errorsAt = (path: string) =>
      vi.waitFor(() =>
        expect(validity.mock.lastCall?.[0].additionalErrors).toEqual([
          host,
          expect.objectContaining({ keyword: 'fileSize', instancePath: path }),
        ]),
      );
    await errorsAt('/' + field + '/2');
    expect(inputs()[1]).toBe(original);
    const button = (key: string) =>
      [...view.container.querySelectorAll<HTMLButtonElement>('button')].find(
        (node) => node.getAttribute('aria-label') === key,
      )!;
    button(messages[locale]['tuple.add']).click();
    await vi.waitFor(() =>
      expect(changes.mock.lastCall?.[0].data[field]).toEqual(['fixed', 'aGVsbG8=', 'aGVsbG8=', '']),
    );
    expect(inputs()[1]).toBe(original);
    const remove = (index: number) =>
      view.container
        .querySelector<HTMLButtonElement>(
          `[data-additional-item="${index}"] .additional-item-actions button`,
        )!
        .click();
    remove(1);
    await vi.waitFor(() =>
      expect(changes.mock.lastCall?.[0].data).toEqual({
        [field]: ['fixed', 'aGVsbG8=', ''],
        sibling: 'keep',
      }),
    );
    expect(inputs()[0]).toBe(original);
    await errorsAt('/' + field + '/1');
    remove(1);
    await vi.waitFor(() => expect(changes.mock.lastCall?.[0].data[field]).toEqual(['fixed', '']));
    await vi.waitFor(() => expect(validity.mock.lastCall?.[0].additionalErrors).toEqual([host]));
    expect(original.isConnected).toBe(false);
  },
);

it.each(['en', 'bg'] as const)(
  'retains tuple-tail Monaco models on local edits/removal and disposes externally replaced subjects in %s',
  async (locale) => {
    const { monaco } =
      await import('../../../jsonforms-svelte-extended/src/lib/components/monaco-api.js');
    const validity = vi.fn<(event: JsonFormsValidityEvent) => void>();
    const changes = vi.fn();
    const host = {
      instancePath: '/host',
      keyword: 'server',
      schemaPath: '',
      params: {},
      message: 'Keep host error',
    };
    const view = await render(JsonForms, {
      props: {
        schema: {
          type: 'object',
          properties: {
            value: {
              type: 'array',
              items: [{ type: 'number' }],
              additionalItems: { type: ['string', 'null'] },
            },
          },
        } as JsonSchema,
        uischema: {
          type: 'Control',
          scope: '#/properties/value',
          options: { confirmation: { delete: 'never' } },
        },
        data: { value: [1, 'same', 'same'], sibling: 'keep' },
        config: { jsonformsExtended: { mixed: { structuredLayout: 'code' } } },
        i18n: { locale },
        renderers: [...skeletonExtendedRenderers, ...skeletonRenderers],
        cells: [...skeletonExtendedCells, ...skeletonCells],
        additionalErrors: [host],
        onvaliditychange: validity,
        onchange: changes,
      },
    });
    const editors = () =>
      monaco.editor.getEditors().filter((editor) => view.container.contains(editor.getDomNode()));
    await vi.waitFor(() => expect(editors()).toHaveLength(2), { timeout: 10000 });
    const editorAt = (index: number) =>
      editors().find((editor) =>
        view.container
          .querySelector(`[data-additional-item="${index}"]`)
          ?.contains(editor.getDomNode()),
      );
    const editor = editorAt(2)!;
    const model = editor.getModel()!;
    model.setValue('"edited"');
    await vi.waitFor(() =>
      expect(changes.mock.lastCall?.[0].data.value).toEqual([1, 'same', 'edited']),
    );
    expect(model.isDisposed()).toBe(false);
    expect(editorAt(2)).toBe(editor);
    await vi.waitFor(() => expect(validity.mock.lastCall?.[0].pending).toBe(false));
    const remove = (index: number) =>
      view.container
        .querySelector<HTMLButtonElement>(
          `[data-additional-item="${index}"] .additional-item-actions button`,
        )!
        .click();
    remove(1);
    await vi.waitFor(() => expect(changes.mock.lastCall?.[0].data.value).toEqual([1, 'edited']));
    expect(editorAt(1)).toBe(editor);
    expect(editor.getModel()).toBe(model);
    model.setValue('{ broken');
    await vi.waitFor(
      () =>
        expect(validity.mock.lastCall?.[0].additionalErrors).toEqual([
          host,
          expect.objectContaining({ keyword: 'editor', instancePath: '/value/1' }),
        ]),
      { timeout: 10000 },
    );
    await view.rerender({ data: { value: [1, 'external'], sibling: 'keep' } });
    await vi.waitFor(() => expect(model.isDisposed()).toBe(true));
    await vi.waitFor(() => expect(validity.mock.lastCall?.[0].additionalErrors).toEqual([host]));
    expect(changes.mock.lastCall?.[0].data).toEqual({ value: [1, 'external'], sibling: 'keep' });
  },
);
