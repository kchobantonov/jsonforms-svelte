import { clearAllIds, type JsonSchema } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { entry as enumArrayRendererEntry } from '../../src/lib/complex/EnumArrayRenderer.entry';
import { mountControl, waitForChange } from '../testUtils';

describe('EnumArrayRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(() => {
    cleanup();
  });

  const renderers = [enumArrayRendererEntry];
  const propertySchema = {
    type: 'array',
    title: 'Tags',
    uniqueItems: true,
    minItems: 2,
    items: {
      type: 'string',
      enum: ['A', 'B'],
    } as unknown as JsonSchema,
  } as JsonSchema;

  it('renders enum checkboxes and current selection', () => {
    const { view } = mountControl({
      renderers,
      propertySchema,
      value: ['A'],
    });

    const checkboxes = Array.from(
      view.container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
    );
    expect(checkboxes).toHaveLength(2);
    expect(checkboxes[0].checked).toBe(true);
    expect(checkboxes[1].checked).toBe(false);
  });

  it('updates core data when checkbox state changes', async () => {
    const { view, onchange } = mountControl({
      renderers,
      propertySchema,
      value: ['A'],
    });

    const checkboxes = Array.from(
      view.container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
    );
    const before = onchange.mock.calls.length;

    checkboxes[1].checked = true;
    checkboxes[1].dispatchEvent(new Event('input', { bubbles: true }));
    const changeEvent = await waitForChange(onchange, before);

    const value = changeEvent.data.value as string[];
    expect(value).toContain('A');
    expect(value).toContain('B');
  });

  it('preserves selected values in rendered checkboxes', () => {
    const { view } = mountControl({
      renderers,
      propertySchema,
      value: ['A'],
    });

    const checkboxes = Array.from(
      view.container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
    );
    expect(checkboxes[0].checked).toBe(true);
    expect(checkboxes[1].checked).toBe(false);
  });
});
