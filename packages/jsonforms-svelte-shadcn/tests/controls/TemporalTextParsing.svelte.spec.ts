import { afterEach, expect, it } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import { mountControl, waitForChange } from '../testUtils';
import { entry as date } from '../../src/lib/controls/DateControlRenderer.entry';
import { entry as time } from '../../src/lib/controls/TimeControlRenderer.entry';
import { entry as datetime } from '../../src/lib/controls/DateTimeControlRenderer.entry';
afterEach(cleanup);
for (const [entry, format, display, invalid, valid] of [
  [date, 'date', 'YYYY-MM-DD', '2026-02-31', '2026-02-28'],
  [time, 'time', 'HH:mm:ss[Z]', '25:00:00Z', '23:00:00Z'],
  [
    datetime,
    'date-time',
    'YYYY-MM-DD[T]HH:mm:ss[Z]',
    '2026-02-31T12:00:00Z',
    '2026-02-28T12:00:00Z',
  ],
] as const) {
  it(`preserves impossible ${format} text for validation and correction`, async () => {
    const { onchange } = mountControl({
      renderers: [entry],
      propertySchema: { type: 'string', format },
      value: valid,
      options: {
        mask: false,
        dateFormat: display,
        dateSaveFormat: display,
        timeFormat: display,
        timeSaveFormat: display,
        dateTimeFormat: display,
        dateTimeSaveFormat: display,
      },
    });
    await tick();
    const input = document.querySelector<HTMLInputElement>('input[id$="-input"]')!;
    async function edit(value: string) {
      const before = onchange.mock.calls.length;
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('blur'));
      return await waitForChange(onchange, before);
    }
    const event = await edit(invalid);
    expect(event.data.value).toBe(invalid);
    expect(event.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ keyword: 'format' })]),
    );
    await tick();
    expect(input.value).toBe(invalid);
    expect((await edit(valid)).errors).toEqual([]);
  });
}
