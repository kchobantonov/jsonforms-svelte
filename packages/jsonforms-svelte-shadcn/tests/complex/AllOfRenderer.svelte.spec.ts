import { clearAllIds, type JsonSchema } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { entry as allOfRendererEntry } from '../../src/lib/complex/AllOfRenderer.entry';
import { entry as stringControlRendererEntry } from '../../src/lib/controls/StringControlRenderer.entry';
import { entry as groupRendererEntry } from '../../src/lib/layouts/GroupRenderer.entry';
import { entry as layoutRendererEntry } from '../../src/lib/layouts/LayoutRenderer.entry';
import { mountControl, waitForChange } from '../testUtils';

describe('AllOfRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(() => {
    cleanup();
  });

  const renderers = [
    allOfRendererEntry,
    groupRendererEntry,
    layoutRendererEntry,
    stringControlRendererEntry,
  ];

  const propertySchema: JsonSchema = {
    allOf: [
      {
        type: 'object',
        properties: {
          firstName: { type: 'string', title: 'First Name', minLength: 2 },
        },
        required: ['firstName'],
      },
      {
        type: 'object',
        properties: {
          lastName: { type: 'string', title: 'Last Name', minLength: 3 },
        },
        required: ['lastName'],
      },
    ],
  };

  it('renders allOf subschema controls', () => {
    const { view } = mountControl({
      renderers,
      propertySchema,
      value: { firstName: 'Ada', lastName: 'Lovelace' },
    });

    const inputs = Array.from(
      view.container.querySelectorAll<HTMLInputElement>('input[type="text"]'),
    );
    expect(inputs).toHaveLength(2);
    expect(inputs[0].value).toBe('Ada');
    expect(inputs[1].value).toBe('Lovelace');
  });

  it('updates core data when allOf child control changes', async () => {
    const { view, onchange } = mountControl({
      renderers,
      propertySchema,
      value: { firstName: 'Ada', lastName: 'Lovelace' },
    });

    const inputs = Array.from(
      view.container.querySelectorAll<HTMLInputElement>('input[type="text"]'),
    );
    const before = onchange.mock.calls.length;

    inputs[1].value = 'Byron';
    inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
    const changeEvent = await waitForChange(onchange, before);

    const value = changeEvent.data.value as { lastName: string };
    expect(value.lastName).toBe('Byron');
  });

  it('renders invalid allOf data in child controls', () => {
    const { view } = mountControl({
      renderers,
      propertySchema,
      value: { firstName: 'Ada', lastName: 'Li' },
    });

    const inputs = Array.from(
      view.container.querySelectorAll<HTMLInputElement>('input[type="text"]'),
    );
    expect(inputs).toHaveLength(2);
    expect(inputs[1].value).toBe('Li');
  });
});
