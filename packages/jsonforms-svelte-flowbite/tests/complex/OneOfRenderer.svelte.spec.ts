import { clearAllIds, type JsonSchema } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { entry as oneOfRendererEntry } from '../../src/lib/complex/OneOfRenderer.entry';
import { entry as stringControlRendererEntry } from '../../src/lib/controls/StringControlRenderer.entry';
import { entry as groupRendererEntry } from '../../src/lib/layouts/GroupRenderer.entry';
import { entry as layoutRendererEntry } from '../../src/lib/layouts/LayoutRenderer.entry';
import { mountControl, waitForChange } from '../testUtils';

describe('OneOfRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(() => {
    cleanup();
  });

  const renderers = [
    oneOfRendererEntry,
    groupRendererEntry,
    layoutRendererEntry,
    stringControlRendererEntry,
  ];

  const propertySchema: JsonSchema = {
    oneOf: [
      {
        type: 'object',
        title: 'Person',
        properties: {
          name: { type: 'string', title: 'Name' },
        },
        required: ['name'],
      },
      {
        type: 'object',
        title: 'Location',
        properties: {
          city: { type: 'string', title: 'City' },
        },
        required: ['city'],
      },
    ],
  };

  it('renders oneOf selector when no data is provided', () => {
    const { view } = mountControl({ renderers, propertySchema });

    const select = view.container.querySelector<HTMLSelectElement>('select');
    expect(select).toBeTruthy();
    expect(select?.value ?? '').toBe('');
  });

  it('updates core data when selecting a oneOf schema from empty data', async () => {
    const { view, onchange } = mountControl({ renderers, propertySchema });

    const select = view.container.querySelector<HTMLSelectElement>('select');
    expect(select).toBeTruthy();

    const firstUsableValue = Array.from(select!.options)
      .map((option) => option.value)
      .find((value) => value !== '');

    expect(firstUsableValue).toBeTruthy();
    const before = onchange.mock.calls.length;

    select!.value = firstUsableValue as string;
    select!.dispatchEvent(new Event('change', { bubbles: true }));
    const changeEvent = await waitForChange(onchange, before);

    expect(typeof changeEvent.data.value).toBe('object');
    expect(changeEvent.data.value).toBeTruthy();
  });

  it('updates core data when active oneOf subschema input changes', async () => {
    const { view, onchange } = mountControl({
      renderers,
      propertySchema,
      value: { name: 'Ada' },
    });

    const input = view.container.querySelector<HTMLInputElement>('input[type="text"]');
    expect(input).toBeTruthy();
    expect(input?.value).toBe('Ada');

    const before = onchange.mock.calls.length;
    input!.value = 'Grace';
    input!.dispatchEvent(new Event('input', { bubbles: true }));
    const changeEvent = await waitForChange(onchange, before);

    const value = changeEvent.data.value as { name: string };
    expect(value.name).toBe('Grace');
  });
});
