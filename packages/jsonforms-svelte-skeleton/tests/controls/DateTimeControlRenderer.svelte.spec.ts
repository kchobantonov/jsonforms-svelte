import { tick } from 'svelte';
import '../test.css';
import { clearAllIds } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';
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

  afterEach(async () => {
    await cleanup();
  });

  const renderers = [dateTimeControlRendererEntry];
  const options = {
    mask: false,
    dateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
    dateTimeSaveFormat: 'YYYY-MM-DDTHH:mm:ss',
    placeholder: 'YYYY-MM-DD HH:mm:ss',
  };

  it('associates visible temporal help while preserving authored descriptions', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { type: 'string', format: 'date-time', description: 'Temporal input help' },
      options: { ...options, skeleton: { input: { 'aria-describedby': 'author-help' } } },
    });
    const input = getBySelector<HTMLInputElement>(view.container, 'input[id$="-input"]');
    expect(input.getAttribute('aria-describedby')?.split(' ')).toContain('author-help');
    input.focus();
    await tick();
    const helper = view.container.querySelector<HTMLElement>('[id$="-help"]');
    expect(helper?.textContent).toContain('Temporal input help');
    expect(input.getAttribute('aria-describedby')?.split(' ')).toContain(helper?.id);
  });

  it('renders datetime input when no data is provided', async () => {
    const { view } = await mountControl({
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
    const { view, onchange } = await mountControl({
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

  it('renders validation error for invalid value', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { type: 'string', format: 'date-time' },
      value: 'invalid-date-time',
      options,
      required: true,
    });

    expectValidationError(view.container);
  });

  it('bounds the date-time popup content for short viewports', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { type: 'string', format: 'date-time' },
      value: '2026-05-01T10:15:00Z',
    });
    getBySelector<HTMLButtonElement>(view.container, '[aria-label="Choose date and time"]').click();
    await expect
      .poll(() => document.querySelector('[data-scope="date-picker"][data-part="content"]'))
      .not.toBeNull();
    const popup = document.querySelector<HTMLElement>(
      '[data-scope="date-picker"][data-part="content"]',
    )!;
    expect(getComputedStyle(popup).maxHeight).toBe('480px');
    expect(getComputedStyle(popup).overflowY).toBe('auto');
  });
});
