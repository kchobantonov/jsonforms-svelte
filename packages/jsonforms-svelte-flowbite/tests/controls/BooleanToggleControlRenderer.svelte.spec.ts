import { clearAllIds } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { entry as booleanToggleControlRendererEntry } from '../../src/lib/controls/BooleanToggleControlRenderer.entry';
import {
  expectLabelVisible,
  expectValidationError,
  getBySelector,
  mountControl,
  waitForChange,
} from '../testUtils';

describe('BooleanToggleControlRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(() => {
    cleanup();
  });

  const renderers = [booleanToggleControlRendererEntry];

  it('renders toggle when no data is provided', () => {
    const { view } = mountControl({
      renderers,
      propertySchema: { type: 'boolean', title: 'Enabled' },
      options: { toggle: true },
    });

    const input = getBySelector<HTMLInputElement>(view.container, 'input[type="checkbox"]');
    expect(input.checked).toBe(false);
    expectLabelVisible(view.container, 'Enabled');
  });

  it('updates core data on toggle change', async () => {
    const { view, onchange } = mountControl({
      renderers,
      propertySchema: { type: 'boolean' },
      value: false,
      options: { toggle: true },
    });

    const input = getBySelector<HTMLInputElement>(view.container, 'input[type="checkbox"]');
    expect(input.checked).toBe(false);
    const before = onchange.mock.calls.length;
    input.checked = true;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const changeEvent = await waitForChange(onchange, before);

    expect(changeEvent.data.value).toBe(true);
  });

  it('renders validation error when required data is missing', () => {
    const { view } = mountControl({
      renderers,
      propertySchema: { type: 'boolean' },
      options: { toggle: true },
      required: true,
    });

    expectValidationError(view.container);
  });
});
