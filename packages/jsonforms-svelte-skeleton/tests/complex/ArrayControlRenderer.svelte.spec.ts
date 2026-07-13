import { clearAllIds, type JsonSchema } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { entry as textCellEntry } from '../../src/lib/cells/TextCell.entry';
import { entry as arrayControlRendererEntry } from '../../src/lib/complex/ArrayControlRenderer.entry';
import { expectCellValidationError, mountControl, waitForChange } from '../testUtils';

describe('ArrayControlRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(() => {
    cleanup();
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

  it('renders table and no-data message when no data is provided', () => {
    const { view } = mountControl({ renderers, cells, propertySchema });

    const text = view.container.textContent ?? '';
    expect(text.includes('People')).toBe(true);
    expect(text.includes('No data')).toBe(true);

    const table = view.container.querySelector('table');
    expect(table).toBeTruthy();
  });

  it('updates core data when item value changes', async () => {
    const { view, onchange } = mountControl({
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

  it('renders validation error for invalid item value', () => {
    const { view } = mountControl({
      renderers,
      cells,
      propertySchema,
      value: [{ name: 'Al' }],
    });

    expectCellValidationError(view.container);
  });
});
