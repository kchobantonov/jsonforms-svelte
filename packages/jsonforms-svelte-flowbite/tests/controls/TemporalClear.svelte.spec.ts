import { afterEach, expect, it } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { entry as date } from '../../src/lib/controls/DateControlRenderer.entry';
import { entry as time } from '../../src/lib/controls/TimeControlRenderer.entry';
import { entry as dateTime } from '../../src/lib/controls/DateTimeControlRenderer.entry';
import messages from '../../../jsonforms-svelte/src/lib/locales/messages.json';
import { mountControl, waitForChange } from '../testUtils';
afterEach(cleanup);
const cases = [
  { format: 'date', value: '2026-10-10', entry: date },
  { format: 'time', value: '12:30:00', entry: time },
  { format: 'date-time', value: '2026-10-10T12:30:00Z', entry: dateTime },
];
it.each(cases)(
  'uses live catalog clear names and respects clearable for $format',
  async ({ format, value, entry }) => {
    const { view, onchange } = await mountControl({
      propertySchema: { type: 'string', format },
      value,
      renderers: [entry],
      options: { clearable: true },
      i18n: { locale: 'en' },
    });
    await expect
      .element(page.getByRole('button', { name: messages.en['control.clearValue'], exact: true }))
      .toBeVisible();
    await view.rerender({ i18n: { locale: 'bg' } });
    const clear = page.getByRole('button', {
      name: messages.bg['control.clearValue'],
      exact: true,
    });
    await expect.element(clear).toBeVisible();
    const before = onchange.mock.calls.length;
    await clear.click();
    const changed = await waitForChange(onchange, before);
    expect(changed.data.value).toBeUndefined();
    await expect.element(clear).not.toBeInTheDocument();
    await view.rerender({
      data: { value },
      uischema: { type: 'Control', scope: '#/properties/value', options: { clearable: false } },
    });
    await expect.element(clear).not.toBeInTheDocument();
  },
);
