import { clearAllIds } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { entry as dateTimeControlRendererEntry } from '../../src/lib/controls/DateTimeControlRenderer.entry';
import {
  expectLabelVisible,
  expectValidationError,
  getBySelector,
  mountControl,
  waitForChange,
} from '../testUtils';

describe('DateTimeControlRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(() => {
    cleanup();
  });

  const renderers = [dateTimeControlRendererEntry];
  const options = {
    mask: false,
    dateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
    dateTimeSaveFormat: 'YYYY-MM-DDTHH:mm:ss',
    placeholder: 'YYYY-MM-DD HH:mm:ss',
  };

  it('renders datetime input when no data is provided', () => {
    const { view } = mountControl({
      renderers,
      propertySchema: { type: 'string', format: 'date-time', title: 'Event Date Time' },
      options,
    });

    const input = getBySelector<HTMLInputElement>(view.container, 'input[id$="-input"]');
    expect(input.type).toBe('text');
    expect(input.value).toBe('');
    expect(input.getAttribute('placeholder')).toBe('YYYY-MM-DD HH:mm:ss');
    expectLabelVisible(view.container, 'Event Date Time');
  });

  it('updates core data on input', async () => {
    const { view, onchange } = mountControl({
      renderers,
      propertySchema: { type: 'string', format: 'date-time' },
      value: '2026-05-01T10:15:00',
      options,
    });

    const input = getBySelector<HTMLInputElement>(view.container, 'input[id$="-input"]');
    expect(input.value).toBe('2026-05-01 10:15:00');
    const before = onchange.mock.calls.length;
    input.value = '2026-06-02 12:30:00';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const changeEvent = await waitForChange(onchange, before);

    expect(changeEvent.data.value).toBe('2026-06-02T12:30:00');
  });

  it('renders validation error for invalid value', () => {
    const { view } = mountControl({
      renderers,
      propertySchema: { type: 'string', format: 'date-time' },
      value: 'invalid-date-time',
      options,
      required: true,
    });

    expectValidationError(view.container);
  });
});
