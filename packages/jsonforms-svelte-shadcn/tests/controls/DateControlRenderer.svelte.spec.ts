import { tick } from 'svelte';
import { clearAllIds } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
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

  afterEach(async () => {
    await cleanup();
  });

  const renderers = [dateControlRendererEntry];
  const options = {
    mask: false,
    dateFormat: 'YYYY-MM-DD',
    dateSaveFormat: 'YYYY-MM-DD',
    placeholder: 'YYYY-MM-DD',
  };

  it('associates visible temporal help while preserving authored descriptions', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { type: 'string', format: 'date', description: 'Temporal input help' },
      options: { ...options, shadcn: { input: { 'aria-describedby': 'author-help' } } },
    });
    const input = getBySelector<HTMLInputElement>(view.container, 'input[id$="-input"]');
    expect(input.getAttribute('aria-describedby')?.split(' ')).toContain('author-help');
    input.focus();
    await tick();
    const helper = view.container.querySelector<HTMLElement>('[id$="-help"]');
    expect(helper?.textContent).toContain('Temporal input help');
    expect(input.getAttribute('aria-describedby')?.split(' ')).toContain(helper?.id);
  });

  it('renders date input when no data is provided', async () => {
    const { view } = await mountControl({
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
    const { view, onchange } = await mountControl({
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

  it('accepts a complete masked date pasted before Maska reports completion', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: { type: 'string', format: 'date' },
      value: '2026-10-14',
      options: { dateFormat: 'MM/DD/YYYY', dateSaveFormat: 'YYYY-MM-DD' },
      controlled: true,
    });
    const input = getBySelector<HTMLInputElement>(view.container, 'input[id$="-input"]');
    const before = onchange.mock.calls.length;
    input.value = '12/24/2026';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect((await waitForChange(onchange, before)).data.value).toBe('2026-12-24');
  });

  it('opens the calendar after updating the date input', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: { type: 'string', format: 'date' },
      value: '2026-05-01',
      options,
      controlled: true,
    });

    const input = getBySelector<HTMLInputElement>(view.container, 'input[id$="-input"]');
    const before = onchange.mock.calls.length;
    input.value = '2026-06-02';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await waitForChange(onchange, before);

    const trigger = getBySelector<HTMLButtonElement>(view.container, '[aria-label="Choose date"]');
    trigger.click();

    await vi.waitFor(() => {
      expect(document.body.querySelector('[data-calendar-root]')).toBeTruthy();
    });

    const yearSelect = document.body.querySelector<HTMLSelectElement>(
      '[data-calendar-year-select]',
    );
    expect(yearSelect?.value).toBe('2026');
  });

  it('updates empty core data when a date is selected from the calendar', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: { type: 'string', format: 'date' },
      options,
      controlled: true,
    });

    const trigger = getBySelector<HTMLButtonElement>(view.container, '[aria-label="Choose date"]');
    trigger.click();

    await vi.waitFor(() => {
      expect(document.body.querySelector('[data-bits-day]')).toBeTruthy();
    });

    const days = Array.from(document.body.querySelectorAll<HTMLButtonElement>('[data-bits-day]'));
    const day = days.find(
      (candidate) =>
        candidate.getAttribute('aria-disabled') !== 'true' &&
        candidate.getAttribute('data-outside-month') === null &&
        candidate.getAttribute('data-selected') === null,
    );
    expect(day).toBeTruthy();

    const before = onchange.mock.calls.length;
    day?.click();
    const changeEvent = await waitForChange(onchange, before);

    expect(changeEvent.data.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('renders validation error for invalid value', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { type: 'string', format: 'date' },
      value: 'not-a-date',
      options,
      required: true,
    });

    expectValidationError(view.container);
  });
});
