import { clearAllIds } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { entry as enumControlRendererEntry } from '../../src/lib/controls/EnumControlRenderer.entry';
import {
  expectLabelVisible,
  expectValidationError,
  getBySelector,
  mountControl,
  waitForChange,
} from '../testUtils';

describe('EnumControlRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(() => {
    cleanup();
  });

  const renderers = [enumControlRendererEntry];

  it('renders select when no data is provided', () => {
    const { view } = mountControl({
      renderers,
      propertySchema: { type: 'string', enum: ['A', 'B', 'C'], title: 'Choice' },
    });

    const select = getBySelector<HTMLSelectElement>(view.container, 'select[id$="-input"]');
    expect(select.options.length).toBeGreaterThan(0);
    expect(select.value).toBe('');
    expectLabelVisible(view.container, 'Choice');
  });

  it('updates core data on selection change', async () => {
    const { view, onchange } = mountControl({
      renderers,
      propertySchema: { type: 'string', enum: ['A', 'B', 'C'] },
      value: 'A',
    });

    const select = getBySelector<HTMLSelectElement>(view.container, 'select[id$="-input"]');
    expect(select.value).toBe('A');
    const before = onchange.mock.calls.length;
    select.value = 'B';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    const changeEvent = await waitForChange(onchange, before);

    expect(changeEvent.data.value).toBe('B');
  });

  it('renders validation error when required data is missing', () => {
    const { view } = mountControl({
      renderers,
      propertySchema: { type: 'string', enum: ['A', 'B', 'C'] },
      required: true,
    });

    expectValidationError(view.container);
  });
});
