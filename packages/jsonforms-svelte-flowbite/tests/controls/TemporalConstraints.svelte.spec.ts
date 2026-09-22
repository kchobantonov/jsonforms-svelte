import { page } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import type { JsonSchema } from '@jsonforms/core';
import { mountControl } from '../testUtils';
import { entry as date } from '../../src/lib/controls/DateControlRenderer.entry';
import { entry as time } from '../../src/lib/controls/TimeControlRenderer.entry';
import { entry as dateTime } from '../../src/lib/controls/DateTimeControlRenderer.entry';

beforeEach(() => vi.setSystemTime(new Date(2026, 5, 15, 12)));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
const options = {
  mask: false,
  ampm: false,
  showActions: false,
  dateFormat: 'YYYY-MM-DD',
  dateSaveFormat: 'YYYY-MM-DD',
  timeFormat: 'HH:mm:ss',
  timeSaveFormat: 'HH:mm:ss',
  dateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
  dateTimeSaveFormat: 'YYYY-MM-DDTHH:mm:ss',
};
const labels = {
  date: 'Open date picker',
  time: 'Open time picker',
  dateTime: 'Open date and time picker',
};

function dayButton(day: number) {
  const result = [...document.querySelectorAll<HTMLElement>('[aria-label]')].find(
    (el) =>
      el.textContent?.trim() === `${day}` &&
      /2026/.test(el.getAttribute('aria-label') ?? '') &&
      /June|Jun|6\//.test(el.getAttribute('aria-label') ?? ''),
  );
  expect(result, `calendar day ${day}`).toBeTruthy();
  return result!;
}
function unavailable(el: HTMLElement) {
  return (
    el.hasAttribute('disabled') ||
    el.getAttribute('aria-disabled') === 'true' ||
    el.hasAttribute('data-disabled')
  );
}

describe('temporal bounds from a scoped field', () => {
  for (const [day, hour, direction] of [
    [15, 12, 'down'],
    [17, 14, 'up'],
  ] as const) {
    it(`uses the pending date for the ${direction === 'down' ? 'minimum' : 'maximum'} time bound`, async () => {
      const value = `2026-06-16T${hour}:00:00`;
      const { onchange } = mountControl({
        renderers: [dateTime],
        value,
        options: { ...options, showActions: true },
        propertySchema: {
          type: 'string',
          format: 'date-time',
          formatMinimum: '2026-06-15T12:00:00',
          formatMaximum: '2026-06-17T14:00:00',
        } as JsonSchema,
      });
      await tick();
      await tick();
      await page.getByRole('button', { name: labels.dateTime, exact: true }).click();
      await vi.waitFor(() => expect(dayButton(day)).toBeTruthy());
      dayButton(day).click();
      await tick();
      const hours = document.querySelector<HTMLInputElement>('input.time-input')!;
      expect(hours).toBeTruthy();
      let column = hours.parentElement!;
      while (column.querySelectorAll('button').length < 2) column = column.parentElement!;
      const buttons = column.querySelectorAll<HTMLButtonElement>('button');
      const step = buttons[direction === 'down' ? buttons.length - 1 : 0];
      step.click();
      await tick();
      expect(hours.value).toBe(`${hour}`);
      // Returning to an interior day must release the boundary-day restriction.
      dayButton(16).click();
      await tick();
      step.click();
      await tick();
      expect(hours.value).toBe(`${hour + (direction === 'down' ? -1 : 1)}`);
      expect(onchange.mock.calls.every(([event]) => event.data.value === value)).toBe(true);
    });
  }

  for (const [format, entry, trigger] of [
    ['date', date, labels.date],
    ['date-time', dateTime, labels.dateTime],
  ] as const) {
    for (const exclusive of [false, true]) {
      it(`${format} calendar respects ${exclusive ? 'exclusive' : 'inclusive'} field bounds`, async () => {
        const suffix = format === 'date' ? '' : 'T00:00:00';
        mountControl({
          renderers: [entry],
          options,
          value: format === 'date' ? '2026-06-15' : '2026-06-15T12:00:00',
          propertySchema: {
            type: 'string',
            format,
            [exclusive ? 'formatExclusiveMinimum' : 'formatMinimum']:
              `2026-06-${exclusive ? '13' : '14'}${format === 'date' ? '' : exclusive ? 'T23:59:59' : suffix}`,
            [exclusive ? 'formatExclusiveMaximum' : 'formatMaximum']:
              `2026-06-${exclusive ? '17' : '16'}${format === 'date' ? '' : exclusive ? suffix : 'T23:59:59'}`,
          } as JsonSchema,
        });
        await tick();
        await tick();
        await page.getByRole('button', { name: trigger, exact: true }).click();
        await vi.waitFor(() => expect(unavailable(dayButton(13))).toBe(true));
        expect(unavailable(dayButton(14))).toBe(false);
        expect(unavailable(dayButton(16))).toBe(false);
        expect(unavailable(dayButton(17))).toBe(true);
      });
    }
  }
  for (const [format, entry, trigger] of [
    ['time', time, labels.time],
    ['date-time', dateTime, labels.dateTime],
  ] as const) {
    for (const exclusive of [false, true]) {
      it(`${format} picker prevents stepping beyond ${exclusive ? 'exclusive' : 'inclusive'} bounds`, async () => {
        const prefix = format === 'time' ? '' : '2026-06-15T';
        mountControl({
          renderers: [entry],
          options,
          value: `${prefix}12:00:30`,
          propertySchema: {
            type: 'string',
            format,
            [exclusive ? 'formatExclusiveMinimum' : 'formatMinimum']:
              `${prefix}${exclusive ? '12:00:29' : '12:00:30'}`,
            [exclusive ? 'formatExclusiveMaximum' : 'formatMaximum']:
              `${prefix}${exclusive ? '12:00:31' : '12:00:30'}`,
          } as JsonSchema,
        });
        await tick();
        await tick();
        await page.getByRole('button', { name: trigger, exact: true }).click();
        await vi.waitFor(() =>
          expect(document.querySelectorAll('input.time-input').length).toBe(3),
        );
        const seconds = document.querySelectorAll<HTMLInputElement>('input.time-input')[2];
        let column = seconds.parentElement!;
        while (column.querySelectorAll('button').length < 2) column = column.parentElement!;
        const buttons = column.querySelectorAll<HTMLButtonElement>('button');
        buttons[0].click();
        await tick();
        expect(seconds.value).toBe('30');
        buttons[buttons.length - 1].click();
        await tick();
        expect(seconds.value).toBe('30');
      });
    }
  }
});
