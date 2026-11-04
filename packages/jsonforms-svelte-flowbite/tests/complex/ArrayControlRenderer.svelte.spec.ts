import { clearAllIds, type JsonSchema } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import { entry as textCellEntry } from '../../src/lib/cells/TextCell.entry';
import { flowbiteCells } from '../../src/lib/cells';
import { entry as arrayControlRendererEntry } from '../../src/lib/complex/ArrayControlRenderer.entry';
import { expectCellValidationError, mountControl, mountForm, waitForChange } from '../testUtils';

describe('ArrayControlRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(async () => {
    await cleanup();
  });

  const renderers = [arrayControlRendererEntry];
  const cells = [textCellEntry];
  const propertySchema = {
    title: 'People',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          title: 'Name',
          minLength: 3,
        },
      },
      required: ['name'],
    } as unknown as JsonSchema,
  } as JsonSchema;

  it('ignores removed nested table selection and honors the local table option', () => {
    const context = {
      rootSchema: propertySchema,
      config: { jsonformsExtended: { table: true } },
    };
    expect(
      arrayControlRendererEntry.tester({ type: 'Control', scope: '#' }, propertySchema, context),
    ).toBe(3);
    expect(
      arrayControlRendererEntry.tester(
        { type: 'Control', scope: '#', options: { table: true } },
        propertySchema,
        context,
      ),
    ).toBe(5);
  });

  it('renders table and no-data message when no data is provided', async () => {
    const { view } = await mountControl({ renderers, cells, propertySchema });

    const text = view.container.textContent ?? '';
    expect(text.includes('People')).toBe(true);
    expect(text.includes('No data')).toBe(true);

    const table = view.container.querySelector('table');
    expect(table).toBeTruthy();
  });

  it('deletes selected table rows through one toolbar action', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      cells,
      propertySchema,
      value: [{ name: 'Ada' }, { name: 'Bea' }, { name: 'Cia' }],
      options: { table: true, confirmation: { delete: 'never' } },
    });
    const table = view.container.querySelector('table')!;
    const deleteSelected =
      view.container.querySelector<HTMLButtonElement>('[data-delete-selected]')!;
    expect(deleteSelected.disabled).toBe(true);
    expect(table.querySelectorAll('tbody [data-row-selection]')).toHaveLength(3);
    expect(table.querySelector('tbody button[aria-label="Delete button"]')).toBeNull();
    table.querySelector<HTMLInputElement>('[data-row-selection] input[type="checkbox"]')!.click();
    await expect.poll(() => deleteSelected.disabled).toBe(false);
    table
      .querySelector<HTMLInputElement>('[data-column-selection] input[type="checkbox"]')!
      .click();
    deleteSelected.click();
    await expect.poll(() => onchange.mock.lastCall?.[0].data.value).toEqual([]);
  });

  it('collapses the table from the scoped array default without discarding its content', async () => {
    const { view, onchange } = await mountForm({
      renderers,
      schema: { type: 'object', properties: { value: propertySchema } } as JsonSchema,
      uischema: { type: 'Control', scope: '#/properties/value' },
      data: { value: [{ name: 'Ada' }] },
      config: { jsonformsExtended: { collapsible: true, array: { collapsed: true } } },
    });
    const toggle = view.container.querySelector<HTMLButtonElement>('[data-array-panel-toggle]')!;
    const content = document.getElementById(toggle.getAttribute('aria-controls')!);
    const changeCount = onchange.mock.calls.length;
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(content?.hidden).toBe(true);
    toggle.click();
    await expect.poll(() => content?.hidden).toBe(false);
    expect(content?.querySelector('table')).not.toBeNull();
    expect(onchange.mock.calls.length).toBe(changeCount);
  });

  it('updates core data when item value changes', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      cells,
      propertySchema,
      value: [{ name: 'Ada' }],
    });

    const input = view.container.querySelector<HTMLInputElement>('input[type="text"]');
    expect(input).toBeTruthy();
    expect(input?.value).toBe('Ada');

    const before = onchange.mock.calls.length;
    input!.value = 'Grace';
    input!.dispatchEvent(new Event('input', { bubbles: true }));
    const changeEvent = await waitForChange(onchange, before);

    const value = changeEvent.data.value as Array<{ name: string }>;
    expect(value[0].name).toBe('Grace');
  });

  it('renders validation error for invalid item value', async () => {
    const { view } = await mountControl({
      renderers,
      cells,
      propertySchema,
      value: [{ name: 'Al' }],
    });

    expectCellValidationError(view.container);
  });
  it.each([
    { name: 'explicit false', item: { type: 'boolean', default: false }, expected: false },
    { name: 'explicit zero', item: { type: 'number', default: 0 }, expected: 0 },
    { name: 'explicit null', item: { type: 'null', default: null }, expected: null },
    { name: 'plain string', item: { type: 'string' }, expected: '' },
    { name: 'invalid initial number', item: { type: 'number', minimum: 10 }, expected: 0 },
    { name: 'boolean', item: { type: 'boolean' }, expected: false },
    {
      name: 'object property defaults',
      item: {
        type: 'object',
        properties: { supplied: { type: 'string', default: 'seed' }, missing: { type: 'string' } },
      },
      expected: { supplied: 'seed' },
    },
  ])('initializes an added $name without requiring item validity', async ({ item, expected }) => {
    const { view, onchange } = await mountControl({
      renderers,
      cells: flowbiteCells,
      propertySchema: { type: 'array', title: 'Values', items: item } as JsonSchema,
      value: [],
      options: { table: true },
    });
    const before = onchange.mock.calls.length;
    view.container.querySelector<HTMLButtonElement>('button[aria-label^="Add"]')!.click();
    expect((await waitForChange(onchange, before)).data.value).toEqual([expected]);
  });

  it.each(['date', 'time', 'date-time'] as const)(
    'initializes an added %s item from the current UTC time',
    async (format) => {
      const { view, onchange } = await mountControl({
        renderers,
        propertySchema: {
          type: 'array',
          title: 'Values',
          items: { type: 'string', format },
        } as JsonSchema,
        value: [],
        options: { table: true },
      });
      const beforeTime = new Date();
      const before = onchange.mock.calls.length;
      view.container.querySelector<HTMLButtonElement>('button[aria-label^="Add"]')!.click();
      const result = (await waitForChange(onchange, before)).data.value as string[];
      const afterTime = new Date();
      const asFormat = (time: Date) => {
        const iso = time.toISOString();
        return format === 'date' ? iso.slice(0, 10) : format === 'time' ? iso.slice(11, 19) : iso;
      };
      if (format === 'date-time') {
        expect(Date.parse(result[0])).toBeGreaterThanOrEqual(beforeTime.getTime());
        expect(Date.parse(result[0])).toBeLessThanOrEqual(afterTime.getTime());
      } else {
        expect([asFormat(beforeTime), asFormat(afterTime)]).toContain(result[0]);
      }
    },
  );

  it('preserves an existing item instead of applying its Add default on render', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      cells: flowbiteCells,
      propertySchema: {
        type: 'array',
        title: 'Values',
        items: { type: 'string', default: 'new item' },
      } as JsonSchema,
      value: ['saved item'],
      options: { table: true },
    });
    const before = onchange.mock.calls.length;
    expect(view.container.querySelector<HTMLInputElement>('input[type="text"]')?.value).toBe(
      'saved item',
    );
    const toggle = view.container.querySelector<HTMLButtonElement>('[data-array-panel-toggle]');
    toggle?.click();
    toggle?.click();
    expect(onchange.mock.calls.length).toBe(before);
    expect(view.container.querySelector<HTMLInputElement>('input[type="text"]')?.value).toBe(
      'saved item',
    );
  });

  it('deep-copies explicit object defaults for each added item without changing the schema', async () => {
    const item = { type: 'object', default: { nested: { tags: ['seed'] } } };
    const { view, onchange } = await mountControl({
      renderers,
      cells: flowbiteCells,
      propertySchema: { type: 'array', title: 'Values', items: item } as JsonSchema,
      value: [],
      options: { table: true },
    });
    const add = view.container.querySelector<HTMLButtonElement>('button[aria-label^="Add"]')!;
    const firstBefore = onchange.mock.calls.length;
    add.click();
    await waitForChange(onchange, firstBefore);
    const before = onchange.mock.calls.length;
    add.click();
    const values = (await waitForChange(onchange, before)).data.value as Array<typeof item.default>;
    expect(values).toEqual([item.default, item.default]);
    expect(values[0]).not.toBe(values[1]);
    expect(values[0].nested).not.toBe(values[1].nested);
    expect(values[0].nested.tags).not.toBe(values[1].nested.tags);
    expect(item.default).toEqual({ nested: { tags: ['seed'] } });
  });

  it('edits a dotted table column beneath a dotted array property without touching a lookalike', async () => {
    const data = {
      'rows.log': [{ 'sensor.x': 'Old' }],
      rows: { log: [{ sensor: { x: 'Keep' } }] },
    };
    const { view, onchange } = await mountForm({
      renderers,
      cells,
      schema: {
        type: 'object',
        properties: {
          'rows.log': {
            type: 'array',
            items: {
              type: 'object',
              properties: { 'sensor.x': { type: 'string' } },
            },
          },
          rows: { type: 'object' },
        },
      } as JsonSchema,
      uischema: {
        type: 'Control',
        scope: '#/properties/rows.log',
        options: { table: true },
      },
      data,
    });
    const input = view.container.querySelector<HTMLInputElement>('tbody input[type="text"]')!;
    expect(input.value).toBe('Old');
    const before = onchange.mock.calls.length;
    input.value = 'New';
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    const result = (await waitForChange(onchange, before)).data;
    expect(result).toEqual({
      'rows.log': [{ 'sensor.x': 'New' }],
      rows: { log: [{ sensor: { x: 'Keep' } }] },
    });
    expect(data['rows.log'][0]['sensor.x']).toBe('Old');
    await view.rerender({
      data: result,
      additionalErrors: [
        {
          instancePath: '/rows.log/0/sensor.x',
          keyword: 'server',
          schemaPath: '',
          params: {},
          message: 'Literal sensor error',
        },
      ],
    });
    await expect.poll(() => input.closest('td')?.querySelector('.cell-invalid')).not.toBeNull();
    await view.rerender({
      additionalErrors: [
        {
          instancePath: '/rows/log/0/sensor/x',
          keyword: 'server',
          schemaPath: '',
          params: {},
          message: 'Nested lookalike error',
        },
      ],
    });
    await expect.poll(() => input.closest('td')?.querySelector('.cell-invalid')).toBeNull();
  });
});
