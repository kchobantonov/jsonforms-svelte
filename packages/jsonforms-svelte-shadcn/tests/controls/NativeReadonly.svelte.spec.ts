import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';
import '../test.css';
import messages from '../../../jsonforms-svelte/src/lib/locales/messages.json';
import { page, userEvent } from 'vitest/browser';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { shadcnRenderers } from '../../src/lib/renderers';

afterEach(cleanup);

for (const [name, schema, data, options] of [
  ['number', { type: 'number' }, 12.5, {}],
  ['integer', { type: 'integer' }, 12, {}],
  ['mask', { type: 'string' }, '123-456', { mask: '###-###' }],
  ['date', { type: 'string', format: 'date' }, '2026-10-17', { mask: false }],
  ['time', { type: 'string', format: 'time' }, '12:30:00', { mask: false }],
  ['date-time', { type: 'string', format: 'date-time' }, '2026-10-17T12:30:00Z', { mask: false }],
] as const) {
  it(`keeps the native ${name} field focusable and readonly`, async () => {
    const onchange = vi.fn();
    const view = render(JsonForms, {
      props: {
        schema,
        data,
        uischema: { type: 'Control', scope: '#', options },
        config: { separateReadonlyFromDisabled: true },
        readonly: true,
        renderers: shadcnRenderers,
        onchange,
      },
    });
    const input = view.container.querySelector<HTMLInputElement>('input[id$="-input"]')!;
    expect(input).toBeTruthy();
    expect(input.readOnly).toBe(true);
    expect(input.disabled).toBe(false);
    const initial = input.value;
    onchange.mockClear();
    input.focus();
    expect(document.activeElement).toBe(input);
    await userEvent.keyboard('9');
    expect(input.value).toBe(initial);
    expect(onchange).not.toHaveBeenCalled();
    expect(view.container.querySelector('button[aria-label="Clear value"]')).toBeNull();
    await view.rerender({ readonly: false });
    expect(input.readOnly).toBe(false);
  });
}

for (const format of ['date', 'date-time']) {
  it(`preserves native readonly ${format} calendar navigation without selecting dates`, async () => {
    const onchange = vi.fn();
    render(JsonForms, {
      props: {
        schema: { type: 'string', format },
        data: format === 'date' ? '2026-05-05' : '2026-05-05T09:30:00',
        uischema: {
          type: 'Control',
          scope: '#',
          options: { shadcn: { Calendar: { readonly: false } } },
        },
        readonly: true,
        config: { separateReadonlyFromDisabled: true },
        renderers: shadcnRenderers,
        onchange,
      },
    });
    const trigger = format === 'date' ? 'temporal.chooseDate' : 'temporal.chooseDateTime';
    await page.getByRole('button', { name: messages.en[trigger], exact: true }).click();
    const calendar = document.querySelector<HTMLElement>('[data-calendar-root]')!;
    expect(calendar).toBeTruthy();
    onchange.mockClear();
    const day = calendar.querySelector<HTMLElement>(
      '[data-calendar-day][data-value="2026-05-06"]',
    )!;
    await page.elementLocator(day).click();
    expect(calendar.querySelector('[data-selected]')?.getAttribute('data-value')).toBe(
      '2026-05-05',
    );
    await page
      .getByRole('button', { name: messages.en['calendar.nextMonth'], exact: true })
      .click();
    expect(calendar.querySelector('[data-calendar-day][data-value="2026-06-15"]')).not.toBeNull();
    expect(onchange).not.toHaveBeenCalled();
  });
}

it('closes a time popup when readonly is applied during its opening interaction', async () => {
  const view = render(JsonForms, {
    props: {
      schema: { type: 'string', format: 'time' },
      data: '12:30:00',
      uischema: { type: 'Control', scope: '#', options: { mask: false } },
      config: { separateReadonlyFromDisabled: true },
      renderers: shadcnRenderers,
    },
  });
  const trigger = view.container.querySelector<HTMLButtonElement>('button[aria-haspopup]')!;
  trigger.click();
  await view.rerender({ readonly: true });
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  expect(trigger.getAttribute('aria-expanded')).toBe('false');
  expect(trigger.disabled).toBe(true);
  const input = view.container.querySelector<HTMLInputElement>('input[id$="-input"]')!;
  expect(input.readOnly).toBe(true);
  expect(input.disabled).toBe(false);
});
