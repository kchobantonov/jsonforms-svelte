import { createTranslator, type i18nJsonSchema } from '@jsonforms/core';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { skeletonCells, skeletonRenderers } from '@chobantonov/jsonforms-svelte-skeleton';
import { skeletonExtendedCells, skeletonExtendedRenderers } from '../src/lib';
import type { GridApi, GridReadyEvent } from 'ag-grid-community';
import type { AgGridWrappedRow } from '../src/lib/ag-grid/types';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';

afterEach(cleanup);

it('uses filenames for grid filtering and sorting while file cells retain encoded values', async () => {
  const zeta = 'data:text/plain;filename=zeta.txt;base64,c2VjcmV0';
  const alpha = 'data:text/plain;filename=alpha.txt;base64,YQ==';
  let api: GridApi<AgGridWrappedRow> | undefined;
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            file: { type: 'string', format: 'binary' },
            files: { type: 'array', items: { type: 'string', format: 'binary' } },
          },
        },
      },
      data: [
        { file: zeta, files: [zeta] },
        { file: alpha, files: [alpha] },
      ],
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          variant: 'ag-grid',
          agGridOptions: {
            onGridReady: (event: GridReadyEvent<AgGridWrappedRow>) => {
              api = event.api;
            },
          },
        },
      },
      renderers: [...skeletonRenderers, ...skeletonExtendedRenderers],
      cells: [...skeletonCells, ...skeletonExtendedCells],
    },
  });
  await vi.waitFor(() => expect(api?.getDisplayedRowCount()).toBe(2));
  const first = api!.getDisplayedRowAtIndex(0)!;
  expect(api!.getCellValue({ rowNode: first, colKey: 'file' })).toBe('zeta.txt');
  expect(api!.getCellValue({ rowNode: first, colKey: 'files' })).toBe('zeta.txt');
  expect(first.data!.value).toEqual({ file: zeta, files: [zeta] });
  await vi.waitFor(() =>
    expect(view.container.querySelectorAll('input[type="file"][multiple]')).toHaveLength(2),
  );
  expect(view.container.querySelectorAll('.ag-root')).toHaveLength(1);
  api!.setGridOption('quickFilterText', 'c2VjcmV0');
  await vi.waitFor(() => expect(api!.getDisplayedRowCount()).toBe(0));
  api!.setGridOption('quickFilterText', 'zeta');
  await vi.waitFor(() => expect(api!.getDisplayedRowCount()).toBe(1));
  api!.setGridOption('quickFilterText', '');
  api!.applyColumnState({ state: [{ colId: 'file', sort: 'asc' }] });
  await vi.waitFor(() =>
    expect(api!.getDisplayedRowAtIndex(0)?.data?.value).toEqual({ file: alpha, files: [alpha] }),
  );
});

it('updates translated column labels without changing file data or explicit native headings', async () => {
  const fileSchema = {
    type: 'string',
    format: 'binary',
    i18n: 'attachment',
  } satisfies i18nJsonSchema;
  let locale = 'en';
  const translate = createTranslator((key, fallback) =>
    key === 'attachment.label' ? (locale === 'en' ? 'Attachment' : 'Прикачен файл') : fallback,
  );
  let api: GridApi<AgGridWrappedRow> | undefined;
  const data = [{ file: 'data:text/plain;filename=test.txt;base64,YQ==' }];
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            file: fileSchema,
            fixed: { type: 'string', title: 'Fallback' },
          },
        },
      },
      data,
      i18n: { locale, translate },
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          variant: 'ag-grid',
          agGridOptions: {
            columnDefs: [{ field: 'file' }, { field: 'fixed', headerName: 'Authored heading' }],
            onGridReady: (event: GridReadyEvent<AgGridWrappedRow>) => {
              api = event.api;
            },
          },
        },
      },
      renderers: [...skeletonRenderers, ...skeletonExtendedRenderers],
      cells: [...skeletonCells, ...skeletonExtendedCells],
    },
  });
  await vi.waitFor(() => expect(api?.getColumn('file')?.getColDef().headerName).toBe('Attachment'));
  locale = 'bg';
  await view.rerender({ i18n: { locale, translate } });
  await vi.waitFor(() =>
    expect(api?.getColumn('file')?.getColDef().headerName).toBe('Прикачен файл'),
  );
  expect(api!.getColumn('fixed')!.getColDef().headerName).toBe('Authored heading');
  expect(api!.getDisplayedRowAtIndex(0)!.data!.value).toEqual(data[0]);
});
