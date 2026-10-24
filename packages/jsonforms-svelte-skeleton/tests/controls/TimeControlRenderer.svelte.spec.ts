import { clearAllIds } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import { entry as timeControlRendererEntry } from '../../src/lib/controls/TimeControlRenderer.entry';
import {
  expectLabelVisible,
  expectValidationError,
  getBySelector,
  mountControl,
  waitForChange,
} from '../testUtils';

vi.mock('maska/svelte', () => ({
  maska: () => ({
    destroy: () => {},
  }),
}));

describe('TimeControlRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(async () => {
    await cleanup();
  });

  const renderers = [timeControlRendererEntry];
  const options = {
    mask: false,
    timeFormat: 'HH:mm:ss',
    timeSaveFormat: 'HH:mm:ss',
    placeholder: 'HH:mm:ss',
  };

  it('renders time input when no data is provided', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { type: 'string', format: 'time', title: 'Start Time' },
      options,
    });

    const input = getBySelector<HTMLInputElement>(view.container, 'input[id$="-input"]');
    expect(input.type).toBe('text');
    expect(input.value).toBe('');
    expect(input.getAttribute('placeholder')).toBe('HH:mm:ss');
    expectLabelVisible(view.container, 'Start Time');
  });

  it('updates core data on input', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: { type: 'string', format: 'time' },
      value: '10:15:00',
      options,
    });

    const input = getBySelector<HTMLInputElement>(view.container, 'input[id$="-input"]');
    expect(input.value).toBe('10:15:00');
    const before = onchange.mock.calls.length;
    input.value = '11:45:00';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const changeEvent = await waitForChange(onchange, before);

    expect(changeEvent.data.value).toBe('11:45:00');
  });

  it.each(['invalid-time', '13:37:00'])('renders validation error for %s', async (value) => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { type: 'string', format: 'time' },
      value,
      options,
      required: true,
    });

    expectValidationError(view.container);
  });
});
