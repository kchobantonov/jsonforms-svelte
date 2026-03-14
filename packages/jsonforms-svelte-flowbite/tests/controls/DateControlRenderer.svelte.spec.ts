import { clearAllIds } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { entry as dateControlRendererEntry } from '../../src/lib/controls/DateControlRenderer.entry';
import {
  expectLabelVisible,
  expectValidationError,
  getBySelector,
  mountControl,
  waitForChange,
} from '../testUtils';

describe('DateControlRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(() => {
    cleanup();
  });

  const renderers = [dateControlRendererEntry];
  const options = {
    mask: false,
    dateFormat: 'YYYY-MM-DD',
    dateSaveFormat: 'YYYY-MM-DD',
    placeholder: 'YYYY-MM-DD',
  };

  it('renders date input when no data is provided', () => {
    const { view } = mountControl({
      renderers,
      propertySchema: { type: 'string', format: 'date', title: 'Birth Date' },
      options,
    });

    const input = getBySelector<HTMLInputElement>(view.container, 'input[id$="-input"]');
    expect(input.type).toBe('text');
    expect(input.value).toBe('');
    expect(input.getAttribute('placeholder')).toBe('YYYY-MM-DD');
    expectLabelVisible(view.container, 'Birth Date');
  });

  it('updates core data on input', async () => {
    const { view, onchange } = mountControl({
      renderers,
      propertySchema: { type: 'string', format: 'date' },
      value: '2026-05-01',
      options,
    });

    const input = getBySelector<HTMLInputElement>(view.container, 'input[id$="-input"]');
    expect(input.value).toBe('2026-05-01');
    const before = onchange.mock.calls.length;
    input.value = '2026-05-03';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const changeEvent = await waitForChange(onchange, before);

    expect(changeEvent.data.value).toBe('2026-05-03');
  });

  it('renders validation error for invalid value', () => {
    const { view } = mountControl({
      renderers,
      propertySchema: { type: 'string', format: 'date' },
      value: 'not-a-date',
      options,
      required: true,
    });

    expectValidationError(view.container);
  });
});
