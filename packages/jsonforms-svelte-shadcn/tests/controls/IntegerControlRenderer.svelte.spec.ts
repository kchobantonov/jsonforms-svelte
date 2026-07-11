import { clearAllIds } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { entry as integerControlRendererEntry } from '../../src/lib/controls/IntegerControlRenderer.entry';
import {
  expectLabelVisible,
  expectValidationError,
  getBySelector,
  mountControl,
  waitForChange,
} from '../testUtils';

describe('IntegerControlRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(() => {
    cleanup();
  });

  const renderers = [integerControlRendererEntry];

  it('renders integer input when no data is provided', () => {
    const { view } = mountControl({
      renderers,
      propertySchema: { type: 'integer', title: 'Count' },
      options: { placeholder: 'Integer value' },
    });

    const input = getBySelector<HTMLInputElement>(view.container, 'input[id$="-input"]');
    expect(input.type).toBe('number');
    expect(input.getAttribute('step')).toBe('1');
    expect(input.value).toBe('');
    expect(input.getAttribute('placeholder')).toBe('Integer value');
    expectLabelVisible(view.container, 'Count');
  });

  it('updates core data with coerced integer value', async () => {
    const { view, onchange } = mountControl({
      renderers,
      propertySchema: { type: 'integer' },
      value: 2,
    });

    const input = getBySelector<HTMLInputElement>(view.container, 'input[id$="-input"]');
    expect(input.value).toBe('2');
    const before = onchange.mock.calls.length;
    input.value = '7.9';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const changeEvent = await waitForChange(onchange, before);

    expect(changeEvent.data.value).toBe(7);
  });

  it('renders validation error for invalid value', () => {
    const { view } = mountControl({
      renderers,
      propertySchema: { type: 'integer', minimum: 5 },
      value: 2,
      required: true,
    });

    expectValidationError(view.container);
  });
});
