import type { GridApi, GridReadyEvent, RowDragEndEvent } from 'ag-grid-community';
import type { AgGridWrappedRow } from '../../src/lib/ag-grid/types';
import { page } from 'vite-plus/test/browser';
import type { UISchemaElement } from '@jsonforms/core';
import { JsonForms, type JsonFormsValidityEvent } from '@chobantonov/jsonforms-svelte';
import { flowbiteRenderers, flowbiteCells } from '@chobantonov/jsonforms-svelte-flowbite';
import { flowbiteExtendedRenderers, flowbiteExtendedCells } from '../../src/lib';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import messages from '../../../jsonforms-svelte/src/lib/locales/messages.json';

afterEach(cleanup);
it.each(['en', 'bg'] as const)(
  'moves and disposes native grid Monaco ownership in %s',
  async (locale) => {
    const { monaco } =
      await import('../../../jsonforms-svelte-extended/src/lib/components/monaco-api.js');
    let api: GridApi<AgGridWrappedRow>;
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
          type: 'Control',
          scope: '#/properties/rows',
          options: {
            variant: 'ag-grid',
            agGridOptions: {
              onGridReady: (event: GridReadyEvent<AgGridWrappedRow>) => {
                api = event.api;
              },
            },
            showSortButtons: true,
            confirmation: { delete: 'never' },
            rowDetail: {
              presentation: 'panel',
              collapsed: true,
              detail: {
                type: 'Control',
                scope: '#',
                options: { format: 'code', language: 'json', propagateErrors: true },
              },
            },
          },
        } as UISchemaElement,
        i18n: { locale },
        renderers: [...flowbiteRenderers, ...flowbiteExtendedRenderers],
        cells: [...flowbiteCells, ...flowbiteExtendedCells],
        additionalErrors: [host],
        onvaliditychange: validity,
        onchange: changes,
      },
    });
    await vi.waitFor(() => expect(api?.getDisplayedRowCount()).toBe(2), { timeout: 10000 });
    await page
      .getByRole('button', {
        name: messages[locale]['collection.editRowDetails'].replace('{index}', '2'),
        exact: true,
      })
      .click();
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
    const command = async (action: 'up' | 'remove', index: number) => {
      if (action === 'up') {
        api.getGridOption('onRowDragEnd')!({
          api,
          node: api.getDisplayedRowAtIndex(index)!,
          overNode: api.getDisplayedRowAtIndex(0)!,
        } as RowDragEndEvent<AgGridWrappedRow>);
      } else {
        api.deselectAll();
        api.getDisplayedRowAtIndex(index)!.setSelected(true);
        const button = page.getByRole('button', {
          name: messages[locale]['array.removeAriaLabel'],
          exact: true,
        });
        await expect.element(button).toBeEnabled();
        (button.element() as HTMLButtonElement).click();
      }
    };
    await command('up', 1);
    await expectErrorAt('/rows/0');
    expect(editor.getModel()).toBe(model);
    expect(model.isDisposed()).toBe(false);
    await command('remove', 1);
    await vi.waitFor(() => expect(changes.mock.lastCall?.[0].data.rows).toHaveLength(1));
    await expectErrorAt('/rows/0');
    expect(editor.getModel()).toBe(model);
    await command('remove', 0);
    await vi.waitFor(() => expect(validity.mock.lastCall?.[0].additionalErrors).toEqual([host]));
    expect(model.isDisposed()).toBe(true);
    expect(view.container.querySelector('.monaco-editor')).toBeNull();
    expect(changes.mock.lastCall?.[0].data).toEqual({ rows: [], sibling: 'keep' });
  },
);
