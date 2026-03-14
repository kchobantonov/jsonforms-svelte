import { clearAllIds, type JsonSchema } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { arrayListRendererEntry } from '../../src/lib/array';
import { entry as stringControlRendererEntry } from '../../src/lib/controls/StringControlRenderer.entry';
import { mountControl, waitForChange } from '../testUtils';

describe('ArrayListRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(() => {
    cleanup();
  });

  const renderers = [arrayListRendererEntry, stringControlRendererEntry];
  const propertySchema = {
    title: 'Contacts',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          title: 'Name',
          minLength: 2,
        },
      },
      required: ['name'],
    } as unknown as JsonSchema,
  } as JsonSchema;

  it('renders no-data message and add action when no data is provided', () => {
    const { view } = mountControl({
      renderers,
      propertySchema,
    });

    const text = view.container.textContent ?? '';
    expect(text.includes('Contacts')).toBe(true);
    expect(text.includes('No data')).toBe(true);

    const buttons = Array.from(view.container.querySelectorAll<HTMLButtonElement>('button'));
    expect(buttons.length).toBeGreaterThan(0);
    expect(buttons[0].disabled).toBe(false);
  });

  it('adds an item and updates core data', async () => {
    const { view, onchange } = mountControl({
      renderers,
      propertySchema,
      value: [],
    });

    const addButton = Array.from(view.container.querySelectorAll<HTMLButtonElement>('button'))[0];
    const before = onchange.mock.calls.length;
    addButton.click();
    const changeEvent = await waitForChange(onchange, before);

    expect(Array.isArray(changeEvent.data.value)).toBe(true);
    expect((changeEvent.data.value as unknown[]).length).toBe(1);
  });
});
