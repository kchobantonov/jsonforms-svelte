import { clearAllIds, type JsonSchema } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { entry as anyOfRendererEntry } from '../../src/lib/complex/AnyOfRenderer.entry';
import { entry as stringControlRendererEntry } from '../../src/lib/controls/StringControlRenderer.entry';
import { entry as groupRendererEntry } from '../../src/lib/layouts/GroupRenderer.entry';
import { entry as layoutRendererEntry } from '../../src/lib/layouts/LayoutRenderer.entry';
import { expectValidationError, mountControl, waitForChange } from '../testUtils';

describe('AnyOfRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(() => {
    cleanup();
  });

  const renderers = [
    anyOfRendererEntry,
    groupRendererEntry,
    layoutRendererEntry,
    stringControlRendererEntry,
  ];

  const propertySchema: JsonSchema = {
    anyOf: [
      {
        type: 'object',
        title: 'Person',
        properties: {
          name: { type: 'string', title: 'Name', minLength: 3 },
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

  it('renders anyOf tabs and active subschema input', () => {
    const { view } = mountControl({
      renderers,
      propertySchema,
    });

    const tabs = Array.from(
      view.container.querySelectorAll<HTMLButtonElement>('button[role="tab"]'),
    );
    expect(tabs).toHaveLength(2);

    const input = view.container.querySelector<HTMLInputElement>('input[type="text"]');
    expect(input).toBeTruthy();
    expect(input?.value).toBe('');
  });

  it('updates core data when active anyOf subschema input changes', async () => {
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

  it('renders validation error for invalid anyOf data', () => {
    const { view } = mountControl({
      renderers,
      propertySchema,
      value: { name: 'Al' },
    });

    expectValidationError(view.container);
  });
});
