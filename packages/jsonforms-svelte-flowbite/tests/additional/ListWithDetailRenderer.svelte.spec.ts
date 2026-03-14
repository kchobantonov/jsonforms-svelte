import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearAllIds, type JsonSchema, type UISchemaElement } from '@jsonforms/core';
import { cleanup } from 'vitest-browser-svelte';
import { entry as listWithDetailRendererEntry } from '../../src/lib/additional/ListWithDetailRenderer.entry';
import { mountForm, waitForFormChange } from '../testUtils';

describe('ListWithDetailRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(() => {
    cleanup();
  });

  const renderers = [listWithDetailRendererEntry];
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

    const itemButtons = Array.from(
      view.container.querySelectorAll<HTMLButtonElement>('button[aria-current]'),
    );

    expect(itemButtons).toHaveLength(2);
    expect(itemButtons[0].getAttribute('aria-current')).toBe('false');
    expect(itemButtons[1].getAttribute('aria-current')).toBe('false');
    expect((view.container.textContent ?? '').includes('No selection')).toBe(true);

    itemButtons[1].click();

    await vi.waitFor(() => {
      expect(itemButtons[1].getAttribute('aria-current')).toBe('true');
    });

    expect((view.container.textContent ?? '').includes('No selection')).toBe(false);
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
