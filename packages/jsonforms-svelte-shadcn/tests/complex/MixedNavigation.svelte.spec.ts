import { clearAllIds } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { shadcnRenderers } from '../../src/lib/renderers';
import { getBySelector, mountControl } from '../testUtils';
import '../test.css';

const setInput = (input: HTMLInputElement, value: string) => {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
};
const customerRow = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>('[role="treeitem"]'))
    .filter((node) => node.textContent?.includes('customer'))
    .at(-1);
const selectedInput = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLInputElement>('input')).find(
    (input) => input.value === 'Ada',
  );

const openCustomer = async (value = { customer: 'Ada' }) => {
  const result = mountControl({
    renderers: shadcnRenderers,
    propertySchema: { type: ['object', 'string'], additionalProperties: { type: 'string' } },
    value,
  });
  const container = result.view.container;
  getBySelector<HTMLElement>(container, 'button[data-slot="accordion-trigger"]').click();
  await vi.waitFor(() =>
    expect(container.querySelector('button[title="Show primitives"]')).toBeTruthy(),
  );
  getBySelector<HTMLButtonElement>(container, 'button[title="Show primitives"]').click();
  await vi.waitFor(() => expect(customerRow(container)).toBeTruthy());
  customerRow(container)!.click();
  await vi.waitFor(() => expect(selectedInput(container)).toBeTruthy());
  return result;
};

const getComboboxTrigger = (container: HTMLElement): HTMLButtonElement => {
  const byRole = container.querySelector<HTMLButtonElement>('button[aria-haspopup="listbox"]');
  if (byRole) return byRole;

  const byPart = container.querySelector<HTMLButtonElement>('button[data-part="trigger"]');
  if (byPart) return byPart;

  const fallback = Array.from(container.querySelectorAll<HTMLButtonElement>('button')).find(
    (button) => (button.getAttribute('aria-label') ?? '').toLowerCase() !== 'clear value',
  );
  expect(fallback).toBeTruthy();
  return fallback as HTMLButtonElement;
};

const chooseComboboxOption = async (container: HTMLElement, label: string) => {
  getComboboxTrigger(container).dispatchEvent(
    new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }),
  );

  let option: HTMLElement | undefined;
  await vi.waitFor(() => {
    option = Array.from(document.querySelectorAll<HTMLElement>('[role="option"]')).find(
      (candidate) => (candidate.textContent ?? '').trim().toLowerCase() === label.toLowerCase(),
    );
    expect(option).toBeTruthy();
  });

  option!.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'mouse' }));
};

describe('MixedRenderer filtered selection', () => {
  beforeEach(() => clearAllIds());
  afterEach(() => cleanup());

  it('preserves the search and editable selection after rename hides the row', async () => {
    const { view, onchange } = await openCustomer();
    const container = view.container;
    const search = getBySelector<HTMLInputElement>(
      container,
      'input[placeholder="Search tree..."]',
    );
    setInput(search, 'customer');
    await vi.waitFor(() => expect(container.querySelector('button[title="Rename"]')).toBeTruthy());
    getBySelector<HTMLButtonElement>(container, 'button[title="Rename"]').click();
    let rename: HTMLInputElement | undefined;
    await vi.waitFor(() => {
      // Search and rename initially have the same value; select the non-search input.
      rename = Array.from(container.querySelectorAll<HTMLInputElement>('input')).find(
        (input) => input !== search && input.value === 'customer',
      );
      expect(rename).toBeTruthy();
    });
    setInput(rename!, 'client');
    rename!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await vi.waitFor(() => {
      expect(onchange.mock.lastCall?.[0].data.value).toEqual({ client: 'Ada' });
      expect(search.value).toBe('customer');
      expect(container.querySelectorAll('[role="treeitem"]')).toHaveLength(0);
      expect(selectedInput(container)).toBeTruthy();
    });
    const input = selectedInput(container)!;
    setInput(input, 'Grace');
    input.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
    await vi.waitFor(() =>
      expect(onchange.mock.lastCall?.[0].data.value).toEqual({ client: 'Grace' }),
    );
    setInput(search, '');
    await vi.waitFor(() => {
      const selected = Array.from(
        container.querySelectorAll('[role="treeitem"][aria-selected="true"]'),
      );
      expect(selected.some((node) => node.textContent?.includes('client'))).toBe(true);
    });
  });

  it('keeps the selected detail when primitive rows are hidden and restores its highlight', async () => {
    const { view } = await openCustomer();
    const container = view.container;
    getBySelector<HTMLButtonElement>(container, 'button[title="Hide primitives"]').click();
    await vi.waitFor(() => {
      expect(customerRow(container)).toBeUndefined();
      expect(selectedInput(container)).toBeTruthy();
      expect(container.querySelector('button[title="Show primitives"]')).toBeTruthy();
    });
    getBySelector<HTMLButtonElement>(container, 'button[title="Show primitives"]').click();
    await vi.waitFor(() =>
      expect(customerRow(container)?.getAttribute('aria-selected')).toBe('true'),
    );
  });
  it('keeps editing when a selected object becomes a primitive hidden by the toggle', async () => {
    const { view, onchange } = mountControl({
      renderers: shadcnRenderers,
      propertySchema: {
        type: ['object', 'string'],
        additionalProperties: { type: ['object', 'string'] },
      },
      value: { customer: {} },
    });
    const container = view.container;
    getBySelector<HTMLElement>(container, 'button[data-slot="accordion-trigger"]').click();
    let search: HTMLInputElement;
    await vi.waitFor(() => {
      search = getBySelector<HTMLInputElement>(container, 'input[placeholder="Search tree..."]');
    });
    setInput(search!, 'customer');
    await vi.waitFor(() => expect(customerRow(container)).toBeTruthy());
    customerRow(container)!.click();
    let detail: HTMLElement;
    await vi.waitFor(() => {
      detail = getBySelector<HTMLElement>(container, 'nav').parentElement!;
      // Wait for the selected-node breadcrumb, not the parent's compact child editor.
      expect(getBySelector<HTMLElement>(container, 'nav').textContent).toContain('customer');
      expect(detail.querySelector('button[aria-haspopup="listbox"]')).toBeTruthy();
    });
    await chooseComboboxOption(detail!, 'String');
    await vi.waitFor(() => {
      expect(onchange.mock.lastCall?.[0].data.value).toEqual({ customer: '' });
      expect(customerRow(container)).toBeUndefined();
      expect(search!.value).toBe('customer');
      const panel = getBySelector<HTMLElement>(container, 'nav').parentElement!;
      expect(panel.querySelector('input:not([role="combobox"])')).toBeTruthy();
    });
    const input = getBySelector<HTMLInputElement>(
      getBySelector<HTMLElement>(container, 'nav').parentElement!,
      'input:not([role="combobox"])',
    );
    setInput(input, 'Grace');
    input.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
    await vi.waitFor(() =>
      expect(onchange.mock.lastCall?.[0].data.value).toEqual({ customer: 'Grace' }),
    );
  });
  it('changes the type of a selected literal-key object and keeps editing', async () => {
    const { view, onchange } = mountControl({
      renderers: shadcnRenderers,
      propertySchema: {
        type: ['object', 'string'],
        additionalProperties: { type: ['object', 'string'] },
      },
      value: { 'customer.literal': {} },
    });
    const container = view.container;
    getBySelector<HTMLElement>(container, 'button[data-slot="accordion-trigger"]').click();
    let search: HTMLInputElement;
    await vi.waitFor(() => {
      search = getBySelector<HTMLInputElement>(container, 'input[placeholder="Search tree..."]');
    });
    setInput(search!, 'customer.literal');
    await vi.waitFor(() => expect(customerRow(container)).toBeTruthy());
    customerRow(container)!.click();
    let detail: HTMLElement;
    await vi.waitFor(() => {
      detail = getBySelector<HTMLElement>(container, 'nav').parentElement!;
      // Wait for the selected-node breadcrumb, not the parent's compact child editor.
      expect(getBySelector<HTMLElement>(container, 'nav').textContent).toContain(
        'customer.literal',
      );
      expect(detail.querySelector('button[aria-haspopup="listbox"]')).toBeTruthy();
    });
    await chooseComboboxOption(detail!, 'String');
    await vi.waitFor(() => {
      expect(onchange.mock.lastCall?.[0].data.value).toEqual({ 'customer.literal': '' });
      expect(customerRow(container)).toBeUndefined();
      expect(search!.value).toBe('customer.literal');
      const panel = getBySelector<HTMLElement>(container, 'nav').parentElement!;
      expect(panel.querySelector('input:not([role="combobox"])')).toBeTruthy();
    });
    const input = getBySelector<HTMLInputElement>(
      getBySelector<HTMLElement>(container, 'nav').parentElement!,
      'input:not([role="combobox"])',
    );
    setInput(input, 'Grace');
    input.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
    await vi.waitFor(() =>
      expect(onchange.mock.lastCall?.[0].data.value).toEqual({ 'customer.literal': 'Grace' }),
    );
  });
});

it('keeps a prefix-named sibling selected after deleting an empty property', async () => {
  const { view, onchange } = await openCustomer({ customer: '', customerCode: 'Ada' } as any);
  const rows = Array.from(view.container.querySelectorAll<HTMLElement>('[role="treeitem"]'));
  const deleted = rows
    .filter(
      (row) => row.textContent?.includes('customer') && !row.textContent?.includes('customerCode'),
    )
    .at(-1)!;
  expect(deleted).toBeTruthy();
  deleted.querySelector<HTMLButtonElement>('button[title="Delete"]')!.click();
  await vi.waitFor(() => {
    expect(onchange.mock.lastCall?.[0].data.value).toEqual({ customerCode: 'Ada' });
    expect(selectedInput(view.container)).toBeTruthy();
    expect(view.container.querySelector('nav')?.textContent).toContain('customerCode');
  });
  setInput(selectedInput(view.container)!, 'Grace');
  await vi.waitFor(() =>
    expect(onchange.mock.lastCall?.[0].data.value).toEqual({ customerCode: 'Grace' }),
  );
});

describe('mixed tree mutation safety', () => {
  afterEach(cleanup);
  async function openSafety(value: any, schema: any, searchText: string, options = {}) {
    const result = mountControl({
      renderers: shadcnRenderers,
      propertySchema: schema,
      value,
      options,
    });
    const container = result.view.container;
    getBySelector<HTMLElement>(container, 'button[data-slot="accordion-trigger"]').click();
    await vi.waitFor(() =>
      expect(container.querySelector('button[title="Show primitives"]')).toBeTruthy(),
    );
    getBySelector<HTMLButtonElement>(container, 'button[title="Show primitives"]').click();
    const search = getBySelector<HTMLInputElement>(
      container,
      'input[placeholder="Search tree..."]',
    );
    setInput(search, searchText);
    await vi.waitFor(() =>
      expect(container.querySelectorAll('[role="treeitem"]').length).toBeGreaterThan(0),
    );
    return result;
  }
  async function attemptDelete(row: HTMLElement) {
    const button = row.querySelector<HTMLButtonElement>('button[title="Delete"]');
    if (!button || button.disabled) return;
    button.click();
    await new Promise((resolve) => setTimeout(resolve, 50));
    const confirm = Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(
      (b) => b.textContent?.trim() === 'Delete',
    );
    confirm?.click();
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  it('deletes a literal dotted key without touching the nested path', async () => {
    const { view, onchange } = await openSafety(
      { 'a.b': 1, a: { b: 2 } },
      { type: ['object', 'string'] },
      'a.b',
    );
    const row = Array.from(view.container.querySelectorAll<HTMLElement>('[role="treeitem"]'))
      .filter((r) => r.textContent?.includes('a.b'))
      .at(-1)!;
    expect(row.querySelector('button[title="Delete"]')).toBeTruthy();
    await attemptDelete(row);
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.value).toEqual({ a: { b: 2 } }));
  });
  it.each(['a.b', ''])(
    'edits a nested literal key %j through the selected tree node',
    async (key) => {
      const value = { holder: { [key]: 'Original' }, sibling: 'Untouched' };
      const { view, onchange } = await openSafety(
        value,
        { type: ['object', 'string'] },
        key || '""',
      );
      const rows = Array.from(view.container.querySelectorAll<HTMLElement>('[role="treeitem"]'));
      const row = rows.filter((r) => r.textContent?.includes(key || '""')).at(-1)!;
      row.click();
      await vi.waitFor(() =>
        expect(
          Array.from(view.container.querySelectorAll<HTMLInputElement>('input')).some(
            (i) => i.value === 'Original',
          ),
        ).toBe(true),
      );
      const field = Array.from(view.container.querySelectorAll<HTMLInputElement>('input')).find(
        (i) => i.value === 'Original',
      )!;
      setInput(field, 'Updated');
      await vi.waitFor(() =>
        expect(onchange.mock.lastCall?.[0].data.value).toEqual({
          holder: { [key]: 'Updated' },
          sibling: 'Untouched',
        }),
      );
    },
  );
  it('edits the nested empty key from the additional-properties schema example', async () => {
    const schema = {
      type: 'object',
      additionalProperties: {
        type: 'object',
        propertyNames: { minLength: 1 },
        additionalProperties: true,
      },
    };
    const { view, onchange } = await openSafety({ '': { asd: { '': 'Original' } } }, schema, '""');
    const row = Array.from(view.container.querySelectorAll<HTMLElement>('[role="treeitem"]'))
      .filter((r) => r.textContent?.includes('""'))
      .at(-1)!;
    row.click();
    await vi.waitFor(() =>
      expect(
        Array.from(view.container.querySelectorAll<HTMLInputElement>('input')).some(
          (i) => i.value === 'Original',
        ),
      ).toBe(true),
    );
    setInput(
      Array.from(view.container.querySelectorAll<HTMLInputElement>('input')).find(
        (i) => i.value === 'Original',
      )!,
      'Updated',
    );
    await vi.waitFor(() => {
      expect(onchange.mock.lastCall?.[0].data.value).toEqual({ '': { asd: { '': 'Updated' } } });
      expect(onchange.mock.lastCall?.[0].errors).toEqual([]);
    });
  });
  it.each(['', 'renamed.key', '  name  '])(
    'renames a dotted tree key to %j and keeps the editor selected',
    async (name) => {
      const { view, onchange } = await openSafety(
        { 'a.b': 'Original', sibling: 'Untouched' },
        { type: ['object', 'string'] },
        'a.b',
        { allowEmptyPropertyNames: true },
      );
      const row = Array.from(view.container.querySelectorAll<HTMLElement>('[role="treeitem"]'))
        .filter((r) => r.textContent?.includes('a.b'))
        .at(-1)!;
      row.click();
      row.querySelector<HTMLButtonElement>('button[title="Rename"]')!.click();
      const search = view.container.querySelector('input[placeholder="Search tree..."]');
      let rename: HTMLInputElement | undefined;
      await vi.waitFor(() => {
        rename = Array.from(view.container.querySelectorAll<HTMLInputElement>('input')).find(
          (i) => i !== search && i.value === 'a.b',
        );
        expect(rename).toBeTruthy();
      });
      setInput(rename!, name);
      rename!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await vi.waitFor(() =>
        expect(onchange.mock.lastCall?.[0].data.value).toEqual({
          [name]: 'Original',
          sibling: 'Untouched',
        }),
      );
      let field: HTMLInputElement | undefined;
      await vi.waitFor(() => {
        field = Array.from(view.container.querySelectorAll<HTMLInputElement>('input')).find(
          (i) => i.value === 'Original',
        );
        expect(field).toBeTruthy();
      });
      setInput(field!, 'Updated');
      await vi.waitFor(() =>
        expect(onchange.mock.lastCall?.[0].data.value).toEqual({
          [name]: 'Updated',
          sibling: 'Untouched',
        }),
      );
    },
  );
  it('inherits readonly through a dotted ancestor', async () => {
    const { view } = await openSafety(
      { 'a.b': { leaf: 'Original' } },
      { type: ['object', 'string'], properties: { 'a.b': { type: 'object', readOnly: true } } },
      'leaf',
    );
    const row = Array.from(view.container.querySelectorAll<HTMLElement>('[role="treeitem"]'))
      .filter((r) => r.textContent?.includes('leaf'))
      .at(-1)!;
    expect(row.querySelector('button[title="Delete"]')).toBeNull();
    expect(row.querySelector('button[title="Rename"]')).toBeNull();
    row.click();
    await vi.waitFor(() => {
      const field = Array.from(view.container.querySelectorAll<HTMLInputElement>('input')).find(
        (i) => i.value === 'Original',
      );
      expect(field).toBeTruthy();
      expect(field!.disabled || field!.readOnly).toBe(true);
    });
  });
  it('honors minProperties on a literal-key parent', async () => {
    const { view } = await openSafety(
      { 'a.b': { leaf: 'Original' } },
      { type: ['object', 'string'], additionalProperties: { type: 'object', minProperties: 1 } },
      'leaf',
    );
    await view.rerender({
      uischema: { type: 'Control', scope: '#/properties/value', options: { restrict: true } },
    });
    const row = Array.from(view.container.querySelectorAll<HTMLElement>('[role="treeitem"]'))
      .filter((r) => r.textContent?.includes('leaf'))
      .at(-1)!;
    const remove = row.querySelector<HTMLButtonElement>('button[title="Delete"]');
    expect(!remove || remove.disabled).toBe(true);
  });
  it('edits a schema-declared dotted key through its selected node', async () => {
    const { view, onchange } = await openSafety(
      { 'a.b': 'Original', a: { b: 'Nested' } },
      {
        type: ['object', 'string'],
        properties: {
          'a.b': { type: 'string' },
          a: { type: 'object', properties: { b: { type: 'string' } } },
        },
      },
      'a.b',
    );
    const row = Array.from(view.container.querySelectorAll<HTMLElement>('[role="treeitem"]'))
      .filter((r) => r.textContent?.includes('a.b'))
      .at(-1)!;
    row.click();
    let field: HTMLInputElement | undefined;
    await vi.waitFor(() => {
      field = Array.from(view.container.querySelectorAll<HTMLInputElement>('input')).find(
        (i) => i.value === 'Original' && !i.disabled && !i.readOnly,
      );
      expect(field).toBeTruthy();
    });
    setInput(field!, 'Updated');
    await vi.waitFor(() =>
      expect(onchange.mock.lastCall?.[0].data.value).toEqual({
        'a.b': 'Updated',
        a: { b: 'Nested' },
      }),
    );
  });
  it('deletes a literal bracketed key without deleting the similarly named array item', async () => {
    const { view, onchange } = await openSafety(
      { 'a[0]': 1, a: [2] },
      { type: ['object', 'string'] },
      'a[0]',
    );
    const row = Array.from(view.container.querySelectorAll<HTMLElement>('[role="treeitem"]'))
      .filter((r) => r.textContent?.includes('a[0]'))
      .at(-1)!;
    expect(row.querySelector('button[title="Delete"]')).toBeTruthy();
    await attemptDelete(row);
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.value).toEqual({ a: [2] }));
  });
  it.each([false, true])('inherits ancestor readOnly even with restrict=%s', async (restrict) => {
    const value = { locked: { child: 1 } };
    const { view, onchange } = await openSafety(
      value,
      {
        type: ['object', 'string'],
        properties: {
          locked: { type: 'object', readOnly: true, additionalProperties: { type: 'number' } },
        },
      },
      'child',
    );
    await view.rerender({
      uischema: { type: 'Control', scope: '#/properties/value', options: { restrict } },
    });
    const row = Array.from(view.container.querySelectorAll<HTMLElement>('[role="treeitem"]'))
      .filter((r) => r.textContent?.includes('child'))
      .at(-1)!;
    expect(row).toBeTruthy();
    await attemptDelete(row);
    expect(onchange.mock.lastCall?.[0].data.value).toEqual(value);
    expect(row.querySelector('button[title="Rename"]')).toBeNull();
    expect(row.querySelector('button[title="Delete"]')).toBeNull();
    row.click();
    await vi.waitFor(() => {
      const panel = view.container.querySelector('nav')?.parentElement;
      const input = panel?.querySelector<HTMLInputElement>('input');
      expect(input).toBeTruthy();
      expect(input!.disabled || input!.readOnly).toBe(true);
    });
  });
  it('rechecks ancestor readonly when confirming a previously opened delete dialog', async () => {
    const value = { locked: { child: { n: 1 } } };
    const unlocked = {
      type: ['object', 'string'],
      properties: {
        locked: {
          type: 'object',
          additionalProperties: { type: 'object', properties: { n: { type: 'number' } } },
        },
      },
    };
    const { view, onchange } = await openSafety(value, unlocked, 'child');
    const row = Array.from(view.container.querySelectorAll<HTMLElement>('[role="treeitem"]'))
      .filter((r) => r.textContent?.includes('child'))
      .at(-1)!;
    row.querySelector<HTMLButtonElement>('button[title="Delete"]')!.click();
    await vi.waitFor(() =>
      expect(
        Array.from(document.querySelectorAll('button')).some(
          (b) => b.textContent?.trim() === 'Delete',
        ),
      ).toBe(true),
    );
    await view.rerender({
      schema: {
        type: 'object',
        properties: {
          value: {
            ...unlocked,
            properties: { locked: { ...unlocked.properties.locked, readOnly: true } },
          },
        },
      },
    });
    const confirm = Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(
      (b) => b.textContent?.trim() === 'Delete',
    )!;
    confirm.click();
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(onchange.mock.lastCall?.[0].data.value).toEqual(value);
  });
});

it('refreshes the selected editor after a schema-only change', async () => {
  const { view } = await openCustomer();
  const input = selectedInput(view.container)!;
  expect(input.disabled || input.readOnly).toBe(false);
  await view.rerender({
    schema: {
      type: 'object',
      properties: {
        value: {
          type: ['object', 'string'],
          additionalProperties: { type: 'string', readOnly: true },
        },
      },
    },
  });
  await vi.waitFor(() => {
    const updated = selectedInput(view.container)!;
    expect(updated.disabled || updated.readOnly).toBe(true);
  });
});
