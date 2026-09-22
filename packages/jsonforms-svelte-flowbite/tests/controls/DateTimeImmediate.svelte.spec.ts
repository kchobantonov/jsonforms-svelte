import { page } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import type { JsonSchema } from '@jsonforms/core';
import { mountControl, waitForChange } from '../testUtils';
import { entry } from '../../src/lib/controls/DateTimeControlRenderer.entry';
beforeEach(() => vi.setSystemTime(new Date(2026, 5, 16, 12)));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
const trigger = 'Open date and time picker';
function day(n: number) {
  const el = [...document.querySelectorAll<HTMLElement>('[aria-label]')].find(
    (el) =>
      el.textContent?.trim() === `${n}` &&
      /2026/.test(el.getAttribute('aria-label') ?? '') &&
      /June|Jun|6\//.test(el.getAttribute('aria-label') ?? ''),
  );
  expect(el).toBeTruthy();
  return el!;
}
async function openAndSelect(n: number) {
  await tick();
  await tick();
  await page.getByRole('button', { name: trigger, exact: true }).click();
  await vi.waitFor(() => expect(day(n)).toBeTruthy());
  day(n).click();
  await tick();
}
function setup(keyword: string, bound: string, hour: number, restrict = true) {
  const value = `2026-06-16T${hour.toString().padStart(2, '0')}:00:00`;
  return {
    value,
    ...mountControl({
      renderers: [entry],
      value,
      propertySchema: { type: 'string', format: 'date-time', [keyword]: bound } as JsonSchema,
      options: {
        showActions: false,
        restrict,
        mask: false,
        ampm: false,
        okLabel: 'Apply',
        dateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
        dateTimeSaveFormat: 'YYYY-MM-DDTHH:mm:ss',
      },
    }),
  };
}
describe('DateTime immediate range checks', () => {
  for (const [keyword, bound, target, hour, correction] of [
    ['formatMinimum', '2026-06-15T12:00:00', 15, 9, 13],
    ['formatMaximum', '2026-06-17T12:00:00', 17, 15, 11],
    ['formatExclusiveMinimum', '2026-06-15T12:00:00', 15, 12, 13],
    ['formatExclusiveMaximum', '2026-06-17T12:00:00', 17, 12, 11],
  ] as const) {
    it(`retains and explains a draft violating ${keyword}, then commits its correction`, async () => {
      const { onchange, value } = setup(keyword, bound, hour);
      await openAndSelect(target);
      expect(document.querySelector('input.time-input')).toBeTruthy();
      expect(
        [...document.querySelectorAll('[role="alert"]')].some(
          (el) => el.textContent === 'Select a date and time within the allowed range.',
        ),
      ).toBe(true);
      // Wait beyond the renderer debounce before checking that no invalid value escaped.
      await new Promise((resolve) => setTimeout(resolve, 400));
      expect(onchange.mock.calls.every(([event]) => event.data.value === value)).toBe(true);
      const before = onchange.mock.calls.length;
      const hours = document.querySelector<HTMLInputElement>('input.time-input')!;
      hours.value = String(correction);
      hours.dispatchEvent(new Event('input', { bubbles: true }));
      await tick();
      expect((await waitForChange(onchange, before)).data.value).toBe(
        `2026-06-${target}T${String(correction).padStart(2, '0')}:00:00`,
      );
      expect(
        [...document.querySelectorAll('[role="alert"]')].some(
          (el) => el.textContent === 'Select a date and time within the allowed range.',
        ),
      ).toBe(false);
    });
  }
  it('permits an out-of-range immediate edit when restrict is false', async () => {
    const { onchange } = setup('formatMinimum', '2026-06-15T12:00:00', 9, false);
    const before = onchange.mock.calls.length;
    await openAndSelect(15);
    expect((await waitForChange(onchange, before)).data.value).toBe('2026-06-15T09:00:00');
  });
  it('translates local feedback without changing committed-data errors', async () => {
    const { view, onchange, value } = setup('formatMinimum', '2026-06-15T12:00:00', 9);
    await view.rerender({
      i18n: {
        locale: 'en',
        translate: (key: string, fallback: string | undefined) =>
          key === 'dateTime.outOfRange' ? 'Choose a value inside the range' : (fallback ?? key),
      },
    });
    await openAndSelect(15);
    await expect
      .element(page.getByText('Choose a value inside the range', { exact: true }))
      .toHaveAttribute('role', 'alert');
    expect(
      onchange.mock.calls.every(
        ([event]) => event.data.value === value && event.errors.length === 0,
      ),
    ).toBe(true);
  });
});
