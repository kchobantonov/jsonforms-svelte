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
const trigger = 'Choose date and time';
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
        showActions: true,
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
describe('DateTime Apply range checks', () => {
  for (const [keyword, bound, target, hour] of [
    ['formatMinimum', '2026-06-15T12:00:00', 15, 9],
    ['formatMaximum', '2026-06-17T12:00:00', 17, 15],
    ['formatExclusiveMinimum', '2026-06-15T12:00:00', 15, 12],
    ['formatExclusiveMaximum', '2026-06-17T12:00:00', 17, 12],
  ] as const) {
    it(`blocks a pending date violating ${keyword} and permits correction`, async () => {
      const { onchange, value } = setup(keyword, bound, hour);
      await openAndSelect(target);
      expect(
        [...document.querySelectorAll<HTMLButtonElement>('button')].find(
          (b) => b.textContent?.trim() === 'Apply',
        )?.disabled,
      ).toBe(true);
      await expect
        .element(
          page.getByText('Select a date and time within the allowed range.', { exact: true }),
        )
        .toHaveAttribute('role', 'alert');
      expect(onchange.mock.calls.every(([event]) => event.data.value === value)).toBe(true);
      // Correct the draft date, then change its time to prove Apply commits an edit.
      day(16).click();
      await tick();
      const hours = document.querySelector<HTMLInputElement>('input.time-input')!;
      hours.value = `${hour + 1}`;
      hours.dispatchEvent(new Event('input', { bubbles: true }));
      await tick();
      await expect.element(page.getByRole('button', { name: 'Apply', exact: true })).toBeEnabled();
      const before = onchange.mock.calls.length;
      await page.getByRole('button', { name: 'Apply', exact: true }).click();
      const event = await waitForChange(onchange, before);
      expect(event.data.value).toBe(`2026-06-16T${(hour + 1).toString().padStart(2, '0')}:00:00`);
    });
  }
  it('allows an out-of-range draft when restrict is false', async () => {
    const { onchange } = setup('formatMinimum', '2026-06-15T12:00:00', 9, false);
    await openAndSelect(15);
    await expect.element(page.getByRole('button', { name: 'Apply', exact: true })).toBeEnabled();
    const before = onchange.mock.calls.length;
    await page.getByRole('button', { name: 'Apply', exact: true }).click();
    expect((await waitForChange(onchange, before)).data.value).toBe('2026-06-15T09:00:00');
  });
  it('discards the invalid draft on Cancel', async () => {
    const { onchange, value } = setup('formatMinimum', '2026-06-15T12:00:00', 9);
    await openAndSelect(15);
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    expect(onchange.mock.calls.every(([event]) => event.data.value === value)).toBe(true);
    await page.getByRole('button', { name: trigger, exact: true }).click();
    await expect.element(page.getByRole('button', { name: 'Apply', exact: true })).toBeEnabled();
    expect(document.querySelector<HTMLInputElement>('input.time-input')?.value).toBe('9');
  });
});
