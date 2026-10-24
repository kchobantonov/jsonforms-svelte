import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';
import { userEvent } from 'vitest/browser';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { flowbiteRenderers } from '../../src/lib/renderers';

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
    const view = await render(JsonForms, {
      props: {
        schema,
        data,
        uischema: { type: 'Control', scope: '#', options },
        config: { separateReadonlyFromDisabled: true },
        readonly: true,
        renderers: flowbiteRenderers,
        onchange,
      },
    });
    const input = view.container.querySelector<HTMLInputElement>('input[id$="-input"]')!;
    expect(input).toBeTruthy();
    expect(input.readOnly).toBe(true);
    expect(input.disabled).toBe(false);
    if (['date', 'time', 'date-time'].includes(name)) {
      expect(
        view.container.querySelector<HTMLButtonElement>('button[aria-haspopup]')?.disabled,
      ).toBe(true);
    }
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

it('closes a time popup when readonly is applied during its opening interaction', async () => {
  const view = await render(JsonForms, {
    props: {
      schema: { type: 'string', format: 'time' },
      data: '12:30:00',
      uischema: { type: 'Control', scope: '#', options: { mask: false } },
      config: { separateReadonlyFromDisabled: true },
      renderers: flowbiteRenderers,
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
