import { afterEach, describe, expect, it } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import type { ErrorObject } from 'ajv';
import { mountControl, waitForChange } from '../testUtils';
import { entry as dateEntry } from '../../src/lib/controls/DateControlRenderer.entry';
import { entry as timeEntry } from '../../src/lib/controls/TimeControlRenderer.entry';
import { entry as dateTimeEntry } from '../../src/lib/controls/DateTimeControlRenderer.entry';

afterEach(cleanup);

describe('Temporal text range validation', () => {
  for (const [format, entry, displayFormat, saveFormat, prefix, suffix] of [
    ['date', dateEntry, 'YYYY-MM-DD', 'YYYY-MM-DD', '2026-06-', ''],
    ['time', timeEntry, 'HH:mm:ss[Z]', 'HH:mm:ss[Z]', '', ':00:00Z'],
    [
      'date-time',
      dateTimeEntry,
      'YYYY-MM-DD[T]HH:mm:ss[Z]',
      'YYYY-MM-DD[T]HH:mm:ss[Z]',
      '2026-06-',
      'T12:00:00Z',
    ],
  ] as const) {
    for (const [keyword, invalid, valid] of [
      ['formatMinimum', '09', '13'],
      ['formatMaximum', '15', '11'],
      ['formatExclusiveMinimum', '12', '13'],
      ['formatExclusiveMaximum', '12', '11'],
    ] as const) {
      it(`${format} commits text violating ${keyword}, then clears errors on correction`, async () => {
        const bound = prefix + '12' + suffix;
        const initial = prefix + valid + suffix;
        const { onchange } = mountControl({
          propertySchema: { type: 'string', format, [keyword]: bound },
          renderers: [entry],
          value: initial,
          options: {
            mask: false,
            restrict: true,
            dateFormat: displayFormat,
            dateSaveFormat: saveFormat,
            timeFormat: displayFormat,
            timeSaveFormat: saveFormat,
            dateTimeFormat: displayFormat,
            dateTimeSaveFormat: saveFormat,
          },
        });
        await tick();
        const input = document.querySelector<HTMLInputElement>('input[id$="-input"]')!;
        expect(input).toBeTruthy();
        const edit = async (value: string) => {
          const before = onchange.mock.calls.length;
          input.value = value;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('blur'));
          return await waitForChange(onchange, before);
        };
        const invalidValue = prefix + invalid + suffix;
        const rejected = await edit(invalidValue);
        expect(rejected.data.value).toBe(invalidValue);
        expect(rejected.errors).toEqual(
          expect.arrayContaining([expect.objectContaining({ keyword, instancePath: '/value' })]),
        );
        await tick();
        // The validator message must reach the visible control as well as form state.
        const error = (rejected.errors as ErrorObject[]).find(
          (error) => error.keyword === keyword,
        )!;
        expect(document.body.textContent).toContain(error.message);
        const corrected = await edit(initial);
        expect(corrected.data.value).toBe(initial);
        expect(corrected.errors).toEqual([]);
        await tick();
        expect(document.body.textContent).not.toContain(error.message);
      });
    }
  }
});
