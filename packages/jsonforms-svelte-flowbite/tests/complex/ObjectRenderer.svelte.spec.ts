import { clearAllIds, type JsonSchema } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { entry as objectRendererEntry } from '../../src/lib/complex/ObjectRenderer.entry';
import { entry as stringControlRendererEntry } from '../../src/lib/controls/StringControlRenderer.entry';
import { entry as groupRendererEntry } from '../../src/lib/layouts/GroupRenderer.entry';
import { entry as layoutRendererEntry } from '../../src/lib/layouts/LayoutRenderer.entry';
import { expectValidationError, getBySelector, mountControl, waitForChange } from '../testUtils';

describe('ObjectRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(() => {
    cleanup();
  });

  const renderers = [
    objectRendererEntry,
    groupRendererEntry,
    layoutRendererEntry,
    stringControlRendererEntry,
  ];

  const propertySchema: JsonSchema = {
    type: 'object',
    title: 'Profile',
    properties: {
      name: {
        type: 'string',
        title: 'Name',
        minLength: 3,
      },
    },
    required: ['name'],
  };

  it('renders nested object control when no data is provided', () => {
    const { view } = mountControl({ renderers, propertySchema });

    const input = getBySelector<HTMLInputElement>(view.container, 'input[type="text"]');
    expect(input.value).toBe('');
  });

  it('updates core data from nested input change', async () => {
    const { view, onchange } = mountControl({
      renderers,
      propertySchema,
      value: { name: 'Ada' },
    });

    const input = getBySelector<HTMLInputElement>(view.container, 'input[type="text"]');
    expect(input.value).toBe('Ada');

    const before = onchange.mock.calls.length;
    input.value = 'Grace';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const changeEvent = await waitForChange(onchange, before);

    const value = changeEvent.data.value as { name: string };
    expect(value.name).toBe('Grace');
  });

  it('renders validation error for invalid nested data', () => {
    const { view } = mountControl({
      renderers,
      propertySchema,
      value: { name: 'Al' },
    });

    expectValidationError(view.container);
  });
});
