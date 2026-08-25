import { clearAllIds, type JsonSchema, type UISchemaElement } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { skeletonRenderers } from '../../src/lib/renderers';
import { mountForm, waitForFormChange } from '../testUtils';

describe('ListWithDetailRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(() => {
    cleanup();
  });

  const renderers = skeletonRenderers;
  const schema = {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        title: 'Contacts',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              title: 'Name',
            },
          },
          required: ['name'],
        },
      } as unknown as JsonSchema,
    },
  } as JsonSchema;
  const uischema = {
    type: 'ListWithDetail',
    scope: '#/properties/items',
    label: 'Contacts',
  } as UISchemaElement;

  it('renders empty state and enabled add button when no data is provided', () => {
    const { view } = mountForm({ renderers, schema, uischema });

    const text = view.container.textContent ?? '';
    expect(text.includes('Contacts')).toBe(true);
    expect(text.includes('No data')).toBe(true);

    const buttons = Array.from(view.container.querySelectorAll<HTMLButtonElement>('button'));
    expect(buttons.length).toBeGreaterThan(0);
    const addButton = buttons[0];
    expect(addButton).toBeTruthy();
    expect(addButton?.disabled).toBe(false);
  });

  it('adds an item and updates core data', async () => {
    const { view, onchange } = mountForm({
      renderers,
      schema,
      uischema,
      data: { items: [] },
    });

    const buttons = Array.from(view.container.querySelectorAll<HTMLButtonElement>('button'));
    expect(buttons.length).toBeGreaterThan(0);
    const addButton = buttons[0];
    expect(addButton).toBeTruthy();

    const before = onchange.mock.calls.length;
    addButton?.click();
    const changeEvent = await waitForFormChange(onchange, before);

    expect(Array.isArray(changeEvent.data.items)).toBe(true);
    expect((changeEvent.data.items as unknown[]).length).toBe(1);
  });

  it('renders list items and updates selection state on click', async () => {
    const { view } = mountForm({
      renderers,
      schema,
      uischema,
      data: { items: [{ name: 'Ada' }, { name: 'Grace' }] },
    });

    const items = Array.from(view.container.querySelectorAll<HTMLElement>('[role="option"]'));
    expect(items).toHaveLength(2);
    expect((view.container.textContent ?? '').includes('No selection')).toBe(true);

    items[1].dispatchEvent(new MouseEvent('click', { bubbles: true }));

    await vi.waitFor(() => {
      expect((view.container.textContent ?? '').includes('No selection')).toBe(false);
    });
  });

  it('keeps the list label empty when the child label value is removed', async () => {
    const { view } = mountForm({
      renderers,
      schema,
      uischema,
      data: { items: [{ name: 'Ada' }] },
    });

    const item = view.container.querySelector<HTMLElement>('[role="option"]');
    const label = item?.querySelector<HTMLElement>('p');

    expect(item).toBeTruthy();
    expect(label).toBeTruthy();
    expect(label?.textContent).toBe('Ada');

    item?.click();
    await vi.waitFor(() => expect(view.container.querySelector('input')).toBeTruthy());

    const input = view.container.querySelector<HTMLInputElement>('input');
    input!.value = '';
    input!.dispatchEvent(new Event('input', { bubbles: true }));

    await vi.waitFor(() => {
      expect(label?.textContent).toBe('');
      expect(item?.textContent).not.toContain('Item 1');
    });
  });

  it('constrains long item labels so the remove button remains in the row', () => {
    const longLabel = `S-1-${'long-label-'.repeat(20)}`;
    const { view } = mountForm({
      renderers,
      schema,
      uischema,
      data: { items: [{ name: longLabel }] },
    });

    const item = view.container.querySelector<HTMLElement>('[role="option"]');
    const label = view.container.querySelector<HTMLElement>(`[title="${longLabel}"]`);
    const removeButton = Array.from(
      view.container.querySelectorAll<HTMLButtonElement>('button'),
    ).at(-1);

    expect(item).toBeTruthy();
    expect(label).toBeTruthy();
    expect(removeButton).toBeTruthy();
    expect(item!.classList.contains('min-w-0')).toBe(true);
    expect(item!.classList.contains('overflow-hidden')).toBe(true);
    expect(label!.classList.contains('truncate')).toBe(true);
    expect(label!.parentElement?.classList.contains('min-w-0')).toBe(true);
  });

  it('removes selected item and updates core data', async () => {
    const { view, onchange } = mountForm({
      renderers,
      schema,
      uischema,
      data: { items: [{ name: 'Ada' }] },
    });

    const buttons = Array.from(view.container.querySelectorAll<HTMLButtonElement>('button'));
    expect(buttons.length).toBeGreaterThan(0);
    const removeButton = buttons[buttons.length - 1];
    expect(removeButton).toBeTruthy();

    const before = onchange.mock.calls.length;
    removeButton?.click();
    const changeEvent = await waitForFormChange(onchange, before);

    expect(Array.isArray(changeEvent.data.items)).toBe(true);
    expect((changeEvent.data.items as unknown[]).length).toBe(0);
  });
});
