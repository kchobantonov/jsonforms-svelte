import { clearAllIds } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { entry as numberControlRendererEntry } from '../../src/lib/controls/NumberControlRenderer.entry';
import {
  expectLabelVisible,
  expectValidationError,
  getBySelector,
  mountControl,
  waitForChange,
} from '../testUtils';

describe('NumberControlRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(() => {
    cleanup();
  });

  const renderers = [numberControlRendererEntry];

  it('renders number input when no data is provided', () => {
    const { view } = mountControl({
      renderers,
      propertySchema: { type: 'number', title: 'Amount' },
      options: { placeholder: 'Amount value' },
    });

    const input = getBySelector<HTMLInputElement>(view.container, 'input[id$="-input"]');
    expect(input.type).toBe('number');
    expect(input.value).toBe('');
    expect(input.getAttribute('placeholder')).toBe('Amount value');
    expectLabelVisible(view.container, 'Amount');
  });

  it('updates core data on input', async () => {
    const { view, onchange } = mountControl({
      renderers,
      propertySchema: { type: 'number' },
      value: 1.5,
    });

    const input = getBySelector<HTMLInputElement>(view.container, 'input[id$="-input"]');
    expect(input.value).toBe('1.5');
    const before = onchange.mock.calls.length;
    input.value = '2.75';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const changeEvent = await waitForChange(onchange, before);

    expect(changeEvent.data.value).toBe(2.75);
  });

  it('renders validation error for invalid value', () => {
    const { view } = mountControl({
      renderers,
      propertySchema: { type: 'number', minimum: 5 },
      value: 1,
      required: true,
    });

    expectValidationError(view.container);
  });
});
