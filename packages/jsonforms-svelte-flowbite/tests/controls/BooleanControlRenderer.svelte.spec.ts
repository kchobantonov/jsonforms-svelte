import { clearAllIds } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { entry as booleanControlRendererEntry } from '../../src/lib/controls/BooleanControlRenderer.entry';
import {
  expectLabelVisible,
  expectValidationError,
  getBySelector,
  mountControl,
  waitForChange,
} from '../testUtils';

describe('BooleanControlRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(() => {
    cleanup();
  });

  const renderers = [booleanControlRendererEntry];

  it('renders checkbox when no data is provided', () => {
    const { view } = mountControl({
      renderers,
      propertySchema: { type: 'boolean', title: 'Enabled' },
    });

    const input = getBySelector<HTMLInputElement>(view.container, 'input[type="checkbox"]');
    expect(input.checked).toBe(false);
    expectLabelVisible(view.container, 'Enabled');
  });

  it('updates core data on checkbox toggle', async () => {
    const { view, onchange } = mountControl({
      renderers,
      propertySchema: { type: 'boolean' },
      value: true,
    });

    const input = getBySelector<HTMLInputElement>(view.container, 'input[type="checkbox"]');
    expect(input.checked).toBe(true);
    const before = onchange.mock.calls.length;
    input.checked = false;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const changeEvent = await waitForChange(onchange, before);

    expect(changeEvent.data.value).toBe(false);
  });

  it('renders validation error when required data is missing', () => {
    const { view } = mountControl({
      renderers,
      propertySchema: { type: 'boolean' },
      required: true,
    });

    expectValidationError(view.container);
  });
});
