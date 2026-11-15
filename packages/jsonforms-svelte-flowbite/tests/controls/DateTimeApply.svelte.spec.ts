import messages from '../../../jsonforms-svelte/src/lib/locales/messages.json';
import { page } from 'vite-plus/test/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import type { JsonSchema, Translator } from '@jsonforms/core';
import { mountControl, waitForChange } from '../testUtils';
import { entry } from '../../src/lib/controls/DateTimeControlRenderer.entry';
beforeEach(() => vi.setSystemTime(new Date(2026, 5, 16, 12)));
afterEach(async () => {
  await cleanup();
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
async function setup(keyword: string, bound: string, hour: number, restrict = true) {
  const value = `2026-06-16T${hour.toString().padStart(2, '0')}:00:00`;
  return {
    value,
    ...(await mountControl({
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
    })),
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
      const { onchange, value } = await setup(keyword, bound, hour);
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
    const { onchange } = await setup('formatMinimum', '2026-06-15T12:00:00', 9, false);
    await openAndSelect(15);
    await expect.element(page.getByRole('button', { name: 'Apply', exact: true })).toBeEnabled();
    const before = onchange.mock.calls.length;
    await page.getByRole('button', { name: 'Apply', exact: true }).click();
    expect((await waitForChange(onchange, before)).data.value).toBe('2026-06-15T09:00:00');
  });
  it('discards the invalid draft on Cancel', async () => {
    const { onchange, value } = await setup('formatMinimum', '2026-06-15T12:00:00', 9);
    await openAndSelect(15);
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    expect(onchange.mock.calls.every(([event]) => event.data.value === value)).toBe(true);
    await page.getByRole('button', { name: trigger, exact: true }).click();
    await expect.element(page.getByRole('button', { name: 'Apply', exact: true })).toBeEnabled();
    expect(document.querySelector<HTMLInputElement>('input.time-input')?.value).toBe('9');
  });
});

it('updates local draft feedback from catalogs and arbitrary host locales without committing it', async () => {
  const { view, onchange, value } = await setup('formatMinimum', '2026-06-15T12:00:00', 9);
  await openAndSelect(15);
  await view.rerender({ i18n: { locale: 'bg' } });
  await expect
    .element(page.getByText(messages.bg['dateTime.outOfRange'], { exact: true }))
    .toBeVisible();
  await view.rerender({
    i18n: {
      locale: 'fr-CA',
      translate: ((key: string, fallback?: string) =>
        key === 'dateTime.outOfRange'
          ? 'Choisissez une date et une heure autorisées.'
          : fallback) as Translator,
    },
  });
  await expect
    .element(page.getByText('Choisissez une date et une heure autorisées.', { exact: true }))
    .toBeVisible();
  expect(onchange.mock.calls.every(([event]) => event.data.value === value)).toBe(true);
  await expect.element(page.getByRole('button', { name: 'Apply', exact: true })).toBeDisabled();
});

it('clears a rejected time step when another date makes the draft valid', async () => {
  const { onchange, value } = await setup('formatMaximum', '2026-06-16T09:00:00', 9);
  await tick();
  await tick();
  await page.getByRole('button', { name: trigger, exact: true }).click();
  await vi.waitFor(() => expect(day(15)).toBeTruthy());
  const before = onchange.mock.calls.length;
  await page.getByRole('button', { name: 'Increase Minutes' }).click();
  await expect
    .element(page.getByText('Select a date and time within the allowed range.', { exact: true }))
    .toBeVisible();
  expect(onchange.mock.calls.length).toBe(before);
  await expect.element(page.getByRole('button', { name: 'Apply', exact: true })).toBeDisabled();
  day(15).click();
  await tick();
  await expect.element(page.getByRole('button', { name: 'Apply', exact: true })).toBeEnabled();
  expect(document.querySelector('[id$="-draft-range"]')).toBeNull();
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  expect((await waitForChange(onchange, before)).data.value).toBe('2026-06-15T09:00:00');
  expect(value).toBe('2026-06-16T09:00:00');
});

it('keeps an offset-bound date-time at its local picker boundary', async () => {
  const initial = '2026-06-15T12:30:00Z';
  const { onchange } = await mountControl({
    renderers: [entry],
    value: initial,
    propertySchema: {
      type: 'string',
      format: 'date-time',
      formatMinimum: '2026-06-15T14:30:00+02:00',
    } as JsonSchema,
    options: {
      showActions: true,
      mask: false,
      dateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
      dateTimeSaveFormat: 'YYYY-MM-DDTHH:mm:ssZ',
    },
  });
  await tick();
  await tick();
  await page.getByRole('button', { name: trigger, exact: true }).click();
  const local = new Date(initial);
  await vi.waitFor(() =>
    expect(document.querySelector<HTMLInputElement>('input.time-input')?.value).toBe(
      String(local.getHours()),
    ),
  );
  const before = onchange.mock.calls.length;
  await page.getByRole('button', { name: 'Decrease Minutes' }).click();
  await expect
    .element(page.getByText('Select a date and time within the allowed range.', { exact: true }))
    .toBeVisible();
  expect(onchange.mock.calls.length).toBe(before);
  await page.getByRole('button', { name: 'Increase Minutes' }).click();
  await expect.element(page.getByRole('button', { name: 'OK', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'OK', exact: true }).click();
  const saved = (await waitForChange(onchange, before)).data.value;
  expect(new Date(saved as string).toISOString()).toBe('2026-06-15T12:31:00.000Z');
});

it('rejects adjacent picker minutes when an exclusive DST range has one valid minute', async () => {
  const initial = '2026-03-08T03:00:00-04:00';
  const { onchange } = await mountControl({
    renderers: [entry],
    value: initial,
    propertySchema: {
      type: 'string',
      format: 'date-time',
      formatExclusiveMinimum: '2026-03-08T01:59:00-05:00',
      formatMaximum: initial,
    } as JsonSchema,
    options: {
      showActions: true,
      mask: false,
      dateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
      dateTimeSaveFormat: 'YYYY-MM-DDTHH:mm:ssZ',
    },
  });
  await tick();
  await tick();
  await page.getByRole('button', { name: trigger, exact: true }).click();
  const local = new Date(initial);
  await vi.waitFor(() =>
    expect(document.querySelector<HTMLInputElement>('input.time-input')?.value).toBe(
      String(local.getHours()),
    ),
  );
  const before = onchange.mock.calls.length;
  await page.getByRole('button', { name: 'Increase Minutes' }).click();
  await expect
    .element(page.getByText('Select a date and time within the allowed range.', { exact: true }))
    .toBeVisible();
  await expect.element(page.getByRole('button', { name: 'OK', exact: true })).toBeDisabled();
  expect(onchange.mock.calls.length).toBe(before);
  const minute = document.querySelectorAll<HTMLInputElement>('input.time-input')[1]!;
  minute.value = String(local.getMinutes());
  minute.dispatchEvent(new Event('input', { bubbles: true }));
  await tick();
  await expect.element(page.getByRole('button', { name: 'OK', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'OK', exact: true }).click();
  expect(
    onchange.mock.calls.every(([event]) =>
      event.data.value
        ? new Date(event.data.value).toISOString() === '2026-03-08T07:00:00.000Z'
        : false,
    ),
  ).toBe(true);
});

it('moves an exclusive midnight bound into the next calendar day', async () => {
  const initial = '2026-06-16T00:00:00';
  const { onchange } = await mountControl({
    renderers: [entry],
    value: initial,
    propertySchema: {
      type: 'string',
      format: 'date-time',
      formatExclusiveMinimum: '2026-06-15T23:59:59',
      formatMaximum: initial,
    } as JsonSchema,
    options: {
      showActions: true,
      mask: false,
      dateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
      dateTimeSaveFormat: 'YYYY-MM-DDTHH:mm:ss',
    },
  });
  await tick();
  await tick();
  await page.getByRole('button', { name: trigger, exact: true }).click();
  await vi.waitFor(() => expect(day(15)).toBeTruthy());
  expect(day(15).getAttribute('aria-disabled')).toBe('true');
  expect(day(16).getAttribute('aria-disabled')).not.toBe('true');
  const before = onchange.mock.calls.length;
  await page.getByRole('button', { name: 'Decrease Seconds' }).click();
  await expect
    .element(page.getByText('Select a date and time within the allowed range.', { exact: true }))
    .toBeVisible();
  await expect.element(page.getByRole('button', { name: 'OK', exact: true })).toBeDisabled();
  expect(onchange.mock.calls.length).toBe(before);
  const second = document.querySelectorAll<HTMLInputElement>('input.time-input')[2]!;
  second.value = '0';
  second.dispatchEvent(new Event('input', { bubbles: true }));
  await tick();
  await expect.element(page.getByRole('button', { name: 'OK', exact: true })).toBeEnabled();
});

it('preserves the second occurrence of a repeated local hour in a staged draft', async () => {
  const initial = '2026-11-01T01:30:00-05:00';
  const { onchange } = await mountControl({
    renderers: [entry],
    value: initial,
    propertySchema: {
      type: 'string',
      format: 'date-time',
      formatMinimum: initial,
      formatMaximum: '2026-11-01T01:45:00-05:00',
    } as JsonSchema,
    options: {
      showActions: true,
      mask: false,
      dateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
      dateTimeSaveFormat: 'YYYY-MM-DDTHH:mm:ssZ',
    },
  });
  await tick();
  await tick();
  await page.getByRole('button', { name: trigger, exact: true }).click();
  await expect.element(page.getByRole('button', { name: 'OK', exact: true })).toBeEnabled();
  const before = onchange.mock.calls.length;
  await page.getByRole('button', { name: 'Increase Minutes' }).click();
  await expect.element(page.getByRole('button', { name: 'OK', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'OK', exact: true }).click();
  const saved = (await waitForChange(onchange, before)).data.value;
  expect(new Date(saved as string).toISOString()).toBe('2026-11-01T06:31:00.000Z');
});

it('preserves the repeated-hour occurrence in immediate picker mode', async () => {
  const initial = '2026-11-01T01:30:00-05:00';
  const { onchange } = await mountControl({
    renderers: [entry],
    value: initial,
    propertySchema: {
      type: 'string',
      format: 'date-time',
      formatMinimum: initial,
      formatMaximum: '2026-11-01T01:45:00-05:00',
    } as JsonSchema,
    options: {
      showActions: false,
      mask: false,
      dateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
      dateTimeSaveFormat: 'YYYY-MM-DDTHH:mm:ssZ',
    },
  });
  await tick();
  await tick();
  await page.getByRole('button', { name: trigger, exact: true }).click();
  const before = onchange.mock.calls.length;
  await page.getByRole('button', { name: 'Increase Minutes' }).click();
  const saved = (await waitForChange(onchange, before)).data.value;
  expect(new Date(saved as string).toISOString()).toBe('2026-11-01T06:31:00.000Z');
});

it('uses the chosen calendar day after a repeated-hour value', async () => {
  const initial = '2026-11-01T01:30:00-05:00';
  const { onchange } = await mountControl({
    renderers: [entry],
    value: initial,
    propertySchema: {
      type: 'string',
      format: 'date-time',
      formatMinimum: initial,
      formatMaximum: '2026-11-03T01:45:00-05:00',
    } as JsonSchema,
    options: {
      showActions: true,
      mask: false,
      dateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
      dateTimeSaveFormat: 'YYYY-MM-DDTHH:mm:ssZ',
    },
  });
  await tick();
  await tick();
  await page.getByRole('button', { name: trigger, exact: true }).click();
  const local = new Date(initial);
  const nextDay = new Date(local);
  nextDay.setDate(local.getDate() + 1);
  if (nextDay.getMonth() !== local.getMonth()) {
    await page
      .getByRole('button', { name: messages.en['calendar.nextMonth'], exact: true })
      .click();
  }
  const target = () =>
    [...document.querySelectorAll<HTMLElement>('[aria-label]')].find(
      (element) =>
        element.textContent?.trim() === String(nextDay.getDate()) &&
        /November|Nov|11\//.test(element.getAttribute('aria-label') ?? ''),
    );
  await vi.waitFor(() => expect(target()).toBeTruthy());
  target()!.click();
  await tick();
  await expect.element(page.getByRole('button', { name: 'OK', exact: true })).toBeEnabled();
  const before = onchange.mock.calls.length;
  await page.getByRole('button', { name: 'OK', exact: true }).click();
  const saved = (await waitForChange(onchange, before)).data.value;
  expect(new Date(saved as string).toISOString()).toBe('2026-11-02T06:30:00.000Z');
});
