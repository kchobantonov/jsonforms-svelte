import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { flowbiteCells, flowbiteRenderers } from '@chobantonov/jsonforms-svelte-flowbite';
import { flowbiteExtendedCells, flowbiteExtendedRenderers } from '../src/lib';
import type { GridApi, GridReadyEvent, RowDragEndEvent } from 'ag-grid-community';
import type { AgGridWrappedRow } from '../src/lib/ag-grid/types';
import type { JsonSchema7 } from '@jsonforms/core';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import { page } from 'vite-plus/test/browser';
import messages from '../../jsonforms-svelte/src/lib/locales/messages.json';
afterEach(cleanup);

async function setup(
  options: Record<string, unknown> = {},
  locale: 'en' | 'bg' = 'en',
  config?: Record<string, unknown>,
  omitLocalSort = false,
) {
  let api: GridApi<AgGridWrappedRow> | undefined;
  const onchange = vi.fn();
  const props = {
    schema: {
      type: 'object',
      properties: {
        rows: {
          type: 'array',
          items: {
            type: 'object',
            properties: { name: { type: 'string' } },
            default: { name: 'new' },
          },
        },
      },
    } as JsonSchema7,
    uischema: {
      type: 'Control',
      scope: '#/properties/rows',
      label: 'Rows',
      options: {
        variant: 'ag-grid',
        ...(omitLocalSort ? {} : { showSortButtons: true }),
        restrict: true,
        confirmation: { delete: 'never' },
        ...options,
        agGridOptions: {
          onGridReady: (event: GridReadyEvent<AgGridWrappedRow>) => {
            api = event.api;
          },
        },
      },
    },
    data: { rows: [{ name: 'Bravo' }, { name: 'Alpha' }, { name: 'Charlie' }], sibling: 'keep' },
    ...(config ? { config } : {}),
    i18n: { locale },
    onchange,
    renderers: [...flowbiteExtendedRenderers, ...flowbiteRenderers],
    cells: [...flowbiteExtendedCells, ...flowbiteCells],
  };
  const view = await render(JsonForms, { props });
  await vi.waitFor(() => expect(api?.getDisplayedRowCount()).toBe(3), { timeout: 5000 });
  const input = () =>
    view.container.querySelector<HTMLInputElement>(
      '.ag-row[row-index="0"] .ag-cell[col-id="name"] input',
    )!;
  await expect.poll(() => !!input()).toBe(true);
  const add = () =>
    page
      .getByRole('button', {
        name: messages[locale]['array.addAriaLabelWithLabel'].replace('{label}', 'Rows'),
        exact: true,
      })
      .element() as HTMLButtonElement;
  const remove = () =>
    page
      .getByRole('button', { name: messages[locale]['array.removeAriaLabel'], exact: true })
      .element() as HTMLButtonElement;
  const draft = (composing = false) => {
    if (composing)
      input().dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    input().value = 'Draft';
    input().dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: composing }));
  };
  const drag = () => {
    const event = {
      api: api!,
      node: api!.getDisplayedRowAtIndex(0)!,
      overNode: api!.getDisplayedRowAtIndex(2)!,
    } as RowDragEndEvent<AgGridWrappedRow>;
    api!.getGridOption('onRowDragEnd')!(event);
  };
  return { props, view, api: api!, input, add, remove, draft, drag, onchange };
}
const settle = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );

it('disables generated cells when the form or array schema becomes readonly', async () => {
  const { props, view, input, api } = await setup();
  expect(api.getGridOption('suppressCellFocus')).toBe(true);
  expect(input().disabled).toBe(false);
  await view.rerender({ readonly: true });
  await expect.poll(() => input().disabled).toBe(true);
  await view.rerender({ readonly: false });
  await expect.poll(() => input().disabled).toBe(false);
  await view.rerender({
    schema: {
      ...props.schema,
      properties: {
        ...props.schema.properties,
        rows: { ...props.schema.properties!.rows, readOnly: true },
      },
    },
  });
  await expect.poll(() => input().disabled).toBe(true);
});

it('lets local false disable a globally enabled grid drag', async () => {
  const { api, drag, onchange } = await setup({ showSortButtons: false }, 'en', {
    showSortButtons: true,
  });
  expect(api.getColumn('$drag')).toBeNull();
  onchange.mockClear();
  drag();
  await settle();
  expect(onchange).not.toHaveBeenCalled();
});

it('uses the global grid sort setting when the local option is absent', async () => {
  const { api, drag, onchange } = await setup({}, 'en', { showSortButtons: true }, true);
  expect(api.getColumn('$drag')?.getColDef()).toMatchObject({
    rowDrag: true,
    width: 38,
    minWidth: 38,
    maxWidth: 38,
  });
  expect(api.getColumn('$drag')?.getActualWidth()).toBe(38);
  drag();
  await expect.poll(() => onchange.mock.lastCall?.[0].data.rows[2].name).toBe('Bravo');
});

it.each(['en', 'bg'] as const)('flushes no-blur cell input and adds once in %s', async (locale) => {
  const { draft, add, onchange } = await setup({}, locale);
  draft();
  add().click();
  add().click();
  await expect
    .poll(() => onchange.mock.lastCall?.[0].data)
    .toEqual({
      rows: [{ name: 'Draft' }, { name: 'Alpha' }, { name: 'Charlie' }, { name: 'new' }],
      sibling: 'keep',
    });
});
it.each(['add', 'delete', 'drag'])(
  'blocks %s during composition and permits retry',
  async (action) => {
    const { props, api, input, draft, add, remove, drag, onchange } = await setup();
    api.getDisplayedRowAtIndex(1)!.setSelected(true);
    await expect.poll(() => remove().disabled).toBe(false);
    draft(true);
    const command = () =>
      action === 'add' ? add().click() : action === 'delete' ? remove().click() : drag();
    command();
    await settle();
    expect(onchange.mock.lastCall?.[0].data).toEqual(props.data);
    input().dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    command();
    const rows =
      action === 'add'
        ? [{ name: 'Draft' }, { name: 'Alpha' }, { name: 'Charlie' }, { name: 'new' }]
        : action === 'delete'
          ? [{ name: 'Draft' }, { name: 'Charlie' }]
          : [{ name: 'Alpha' }, { name: 'Charlie' }, { name: 'Draft' }];
    await expect.poll(() => onchange.mock.lastCall?.[0].data).toEqual({ rows, sibling: 'keep' });
  },
);
it('flushes a pending cell before moving it across multiple source indexes', async () => {
  const { draft, drag, onchange } = await setup();
  draft();
  drag();
  await expect
    .poll(() => onchange.mock.lastCall?.[0].data)
    .toEqual({
      rows: [{ name: 'Alpha' }, { name: 'Charlie' }, { name: 'Draft' }],
      sibling: 'keep',
    });
});
it.each(['sort', 'filter', 'quickFilter', 'hidden'] as const)(
  'rejects drag with %s reorder restrictions',
  async (mode) => {
    const { props, api, drag, onchange } = await setup(
      mode === 'hidden' ? { showSortButtons: false } : {},
    );
    if (mode === 'sort') api.applyColumnState({ state: [{ colId: 'name', sort: 'asc' }] });
    if (mode === 'quickFilter') api.setGridOption('quickFilterText', 'a');
    if (mode === 'filter') {
      api.setFilterModel({ name: { filterType: 'text', type: 'contains', filter: 'a' } });
      api.onFilterChanged();
    }
    await settle();
    drag();
    await settle();
    expect(onchange.mock.lastCall?.[0].data).toEqual(props.data);
  },
);
it('deletes the selected original row after sorting and preserves its neighbor draft', async () => {
  const { api, draft, remove, onchange } = await setup();
  api.applyColumnState({ state: [{ colId: 'name', sort: 'asc' }] });
  await expect.poll(() => api.getDisplayedRowAtIndex(0)?.data?.sourceIndex).toBe(1);
  draft();
  api.getDisplayedRowAtIndex(1)!.setSelected(true);
  await expect.poll(() => remove().disabled).toBe(false);
  remove().click();
  await expect
    .poll(() => onchange.mock.lastCall?.[0].data)
    .toEqual({ rows: [{ name: 'Draft' }, { name: 'Charlie' }], sibling: 'keep' });
});
it.each(['readonly', 'schema', 'data'] as const)(
  'cancels deletion confirmation after %s changes',
  async (change) => {
    const { props, view, api, remove, onchange } = await setup({
      confirmation: { delete: 'always' },
    });
    api.getDisplayedRowAtIndex(1)!.setSelected(true);
    await expect.poll(() => remove().disabled).toBe(false);
    remove().click();
    await expect
      .poll(
        () =>
          page
            .getByRole('dialog')
            .elements()
            .filter((node) => node.checkVisibility()).length,
      )
      .toBe(1);
    const nextData =
      change === 'data' ? { ...props.data, rows: [{ name: 'Replacement' }] } : props.data;
    await view.rerender(
      change === 'readonly'
        ? { readonly: true }
        : change === 'schema'
          ? { schema: { ...props.schema, title: 'New owner' } }
          : { data: nextData },
    );
    await expect
      .poll(
        () =>
          page
            .getByRole('dialog')
            .elements()
            .filter((node) => node.checkVisibility()).length,
      )
      .toBe(0);
    expect(onchange.mock.lastCall?.[0].data).toEqual(nextData);
  },
);
it('declines deletion without discarding the flushed cell draft', async () => {
  const { api, draft, remove, onchange } = await setup({ confirmation: { delete: 'always' } });
  api.getDisplayedRowAtIndex(1)!.setSelected(true);
  await expect.poll(() => remove().disabled).toBe(false);
  draft();
  remove().click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: messages.en['confirm.decline'], exact: true })
    .click();
  expect(onchange.mock.lastCall?.[0].data).toEqual({
    rows: [{ name: 'Draft' }, { name: 'Alpha' }, { name: 'Charlie' }],
    sibling: 'keep',
  });
});
it('honors live disableAdd/disableRemove and readonly options', async () => {
  const { props, view, api, add, remove, drag, onchange } = await setup();
  api.getDisplayedRowAtIndex(1)!.setSelected(true);
  await view.rerender({
    uischema: {
      ...props.uischema,
      options: { ...props.uischema.options, disableAdd: true, disableRemove: true },
    },
  });
  await expect.poll(() => add().disabled && remove().disabled).toBe(true);
  await view.rerender({ readonly: true, uischema: props.uischema });
  await expect.poll(() => add().disabled && remove().disabled).toBe(true);
  await vi.waitFor(() =>
    expect(
      api.getColumnDefs()?.some((column) => 'rowDrag' in column && column.rowDrag === true),
    ).toBe(false),
  );
  drag();
  await settle();
  expect(onchange.mock.lastCall?.[0].data).toEqual(props.data);
  await view.rerender({ readonly: false });
  await vi.waitFor(() =>
    expect(
      api.getColumnDefs()?.some((column) => 'rowDrag' in column && column.rowDrag === true),
    ).toBe(true),
  );
});
it('applies flat and local Add/Delete permission precedence', async () => {
  const { props, view, api, add, remove } = await setup();
  api.getDisplayedRowAtIndex(1)!.setSelected(true);
  await view.rerender({ config: { disableAdd: true, disableRemove: true } });
  await expect.poll(() => add().disabled && remove().disabled).toBe(true);
  await view.rerender({
    uischema: {
      ...props.uischema,
      options: { ...props.uischema.options, disableAdd: false, disableRemove: false },
    },
  });
  await expect.poll(() => !add().disabled && !remove().disabled).toBe(true);
  await view.rerender({
    config: { disableAdd: false, disableRemove: false },
    uischema: {
      ...props.uischema,
      options: { ...props.uischema.options, disableAdd: true, disableRemove: true },
    },
  });
  await expect.poll(() => add().disabled && remove().disabled).toBe(true);
});
it('rechecks maxItems/minItems and permits unrestricted commands', async () => {
  const { props, view, api, add, remove, onchange } = await setup();
  await view.rerender({
    schema: {
      ...props.schema,
      properties: { rows: { ...props.schema.properties!.rows, minItems: 3, maxItems: 3 } },
    },
  });
  api.getDisplayedRowAtIndex(1)!.setSelected(true);
  await expect.poll(() => add().disabled && remove().disabled).toBe(true);
  await view.rerender({
    uischema: { ...props.uischema, options: { ...props.uischema.options, restrict: false } },
  });
  await expect.poll(() => add().disabled).toBe(false);
  add().click();
  await expect.poll(() => onchange.mock.lastCall?.[0].data.rows.length).toBe(4);
});
it.each([true, false])(
  'applies restrict=%s to selected-row deletion at minItems',
  async (restrict) => {
    const { props, view, api, remove, onchange } = await setup({ restrict });
    await view.rerender({
      schema: {
        ...props.schema,
        properties: { rows: { ...props.schema.properties!.rows, minItems: 3 } },
      },
    });
    api.getDisplayedRowAtIndex(1)!.setSelected(true);
    await expect.poll(() => remove().disabled).toBe(restrict);
    const before = onchange.mock.calls.length;
    remove().click();
    if (restrict) {
      await settle();
      expect(onchange.mock.calls.length).toBe(before);
    } else {
      await expect
        .poll(() => onchange.mock.lastCall?.[0].data)
        .toEqual({
          rows: [{ name: 'Bravo' }, { name: 'Charlie' }],
          sibling: 'keep',
        });
    }
  },
);
it.each([
  { name: 'default', options: { restrict: undefined }, config: undefined, disabled: true },
  {
    name: 'flat false',
    options: { restrict: undefined },
    config: { restrict: false },
    disabled: false,
  },
  {
    name: 'local false',
    options: { restrict: false },
    config: { restrict: true },
    disabled: false,
  },
  { name: 'local true', options: { restrict: true }, config: { restrict: false }, disabled: true },
  {
    name: 'removed namespace',
    options: { restrict: undefined },
    config: { jsonformsExtended: { restrict: false } },
    disabled: true,
  },
])('uses $name restriction for AG Grid add bounds', async ({ name, options, config, disabled }) => {
  const { props, view, add, onchange } = await setup(options, 'en', config);
  await view.rerender({
    schema: {
      ...props.schema,
      properties: { rows: { ...props.schema.properties!.rows, maxItems: 3 } },
    },
  });
  await expect.poll(() => add().disabled).toBe(disabled);
  if (name === 'flat false') {
    add().click();
    await expect.poll(() => onchange.mock.lastCall?.[0].data.rows.length).toBe(4);
  }
});
it('cancels an in-flight add when its owner unmounts', async () => {
  const { props, view, add, onchange } = await setup();
  add().click();
  await view.unmount();
  await settle();
  expect(onchange.mock.lastCall?.[0].data).toEqual(props.data);
});
it.each(['add', 'drag'] as const)(
  'cancels queued %s after readonly or schema replacement',
  async (action) => {
    for (const change of ['readonly', 'schema'] as const) {
      const { props, view, add, drag, onchange } = await setup();
      if (action === 'add') add().click();
      else drag();
      await view.rerender(
        change === 'readonly'
          ? { readonly: true }
          : { schema: { ...props.schema, title: 'Replacement owner' } },
      );
      await settle();
      expect(onchange.mock.lastCall?.[0].data).toEqual(props.data);
      await view.unmount();
    }
  },
);
