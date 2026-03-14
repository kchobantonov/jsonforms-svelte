import { clearAllIds, type JsonSchema, type UISchemaElement } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { entry as stringControlRendererEntry } from '../../src/lib/controls/StringControlRenderer.entry';
import { entry as arrayLayoutRendererEntry } from '../../src/lib/layouts/ArrayLayoutRenderer.entry';
import { entry as layoutRendererEntry } from '../../src/lib/layouts/LayoutRenderer.entry';
import { expectValidationError, getBySelector, mountForm, waitForFormChange } from '../testUtils';

describe('ArrayLayoutRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(() => {
    cleanup();
  });

  const renderers = [arrayLayoutRendererEntry, layoutRendererEntry, stringControlRendererEntry];

  const itemSchema = {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        title: 'Name',
        minLength: 2,
      },
    },
    required: ['name'],
  } as JsonSchema;

  const schema = {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        title: 'Items',
        items: itemSchema,
      } as unknown as JsonSchema,
    },
  } as JsonSchema;

  const uischema: UISchemaElement = {
    type: 'Control',
    scope: '#/properties/items',
    options: {
      detail: 'GENERATED',
    },
  };

  it('renders no-data state when no array data is provided', () => {
    const { view } = mountForm({ renderers, schema, uischema });
    const text = view.container.textContent ?? '';

    expect(text.includes('No data')).toBe(true);
    const buttons = Array.from(view.container.querySelectorAll<HTMLButtonElement>('button'));
    expect(buttons.length).toBeGreaterThan(0);
    const addButton = buttons[0];
    expect(addButton.disabled).toBe(false);
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
    const before = onchange.mock.calls.length;
    addButton.dispatchEvent(new Event('click', { bubbles: true }));
    const changeEvent = await waitForFormChange(onchange, before);

    expect(Array.isArray(changeEvent.data.items)).toBe(true);
    expect((changeEvent.data.items as unknown[]).length).toBe(1);

    const input = getBySelector<HTMLInputElement>(view.container, 'input[type="text"]');
    expect(input.value).toBe('');
  });

  it('renders validation error for invalid nested item data', () => {
    const { view } = mountForm({
      renderers,
      schema,
      uischema,
      data: { items: [{ name: 'A' }] },
    });

    expectValidationError(view.container);
  });
});
