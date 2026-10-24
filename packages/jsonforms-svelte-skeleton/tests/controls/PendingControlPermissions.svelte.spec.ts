import { tick } from 'svelte';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { RuleEffect, type ControlElement } from '@jsonforms/core';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';
import { entry } from '../../src/lib/controls/PasswordControlRenderer.entry';
import { entry as enumEntry } from '../../src/lib/controls/EnumControlRenderer.entry';
import { entry as dateEntry } from '../../src/lib/controls/DateControlRenderer.entry';

afterEach(cleanup);

const uischema: ControlElement = {
  type: 'Control',
  scope: '#',
  options: { format: 'password' },
};

for (const replacement of ['readonly', 'disabled', 'data', 'schema', 'restored'] as const) {
  it(`cancels queued password changes after ${replacement} replacement`, async () => {
    const onchange = vi.fn();
    const view = await render(JsonForms, {
      props: {
        schema: { type: 'string' },
        data: 'stored',
        uischema,
        config: { separateReadonlyFromDisabled: true },
        renderers: [entry],
        onchange,
      },
    });
    await vi.waitFor(() => expect(onchange).toHaveBeenCalled());
    onchange.mockClear();
    const input = view.container.querySelector<HTMLInputElement>('input[id$="-input"]')!;
    input.value = 'queued';
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    if (replacement === 'restored') {
      await view.rerender({ readonly: true });
      await view.rerender({ readonly: false });
    }
    if (replacement === 'readonly') await view.rerender({ readonly: true });
    if (replacement === 'disabled')
      await view.rerender({
        uischema: {
          ...uischema,
          rule: { effect: RuleEffect.DISABLE, condition: { scope: '#', schema: {} } },
        },
      });
    if (replacement === 'data') await view.rerender({ data: 'replacement' });
    if (replacement === 'schema') await view.rerender({ schema: { type: 'string', maxLength: 2 } });
    // Flush the registered native blur handler rather than waiting for its timer.
    input.dispatchEvent(new FocusEvent('blur'));
    await new Promise((resolve) => setTimeout(resolve, 350));
    expect(onchange.mock.calls.some(([event]) => event.data === 'queued')).toBe(false);
  });
}

it('preserves writable pending password input across locale changes and commits on blur', async () => {
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: { schema: { type: 'string' }, data: 'stored', uischema, renderers: [entry], onchange },
  });
  const input = view.container.querySelector<HTMLInputElement>('input[id$="-input"]')!;
  input.value = 'queued';
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await view.rerender({ i18n: { locale: 'fr' } });
  input.dispatchEvent(new FocusEvent('blur'));
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toBe('queued'));
});

it('does not commit synthetic input through a disabled native date control', async () => {
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema: { type: 'string', format: 'date' },
      data: '2026-05-05',
      uischema: {
        type: 'Control',
        scope: '#',
        options: { dateFormat: 'YYYY-MM-DD', mask: false },
        rule: { effect: RuleEffect.DISABLE, condition: { scope: '#', schema: {} } },
      },
      renderers: [dateEntry],
      onchange,
    },
  });
  await vi.waitFor(() => expect(onchange).toHaveBeenCalled());
  onchange.mockClear();
  const input = view.container.querySelector<HTMLInputElement>('input[id$="-input"]')!;
  expect(input.disabled).toBe(true);
  input.value = '2026-05-06';
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  input.dispatchEvent(new FocusEvent('blur'));
  await tick();
  expect(onchange).not.toHaveBeenCalled();
});

it('does not move a queued password edit into another property with the same value', async () => {
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'object',
        properties: { first: { type: 'string' }, second: { type: 'string' } },
      },
      data: { first: 'stored', second: 'stored' },
      uischema: { ...uischema, scope: '#/properties/first' },
      renderers: [entry],
      onchange,
    },
  });
  await vi.waitFor(() => expect(onchange).toHaveBeenCalled());
  onchange.mockClear();
  const input = view.container.querySelector<HTMLInputElement>('input[id$="-input"]')!;
  input.value = 'queued';
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await view.rerender({ uischema: { ...uischema, scope: '#/properties/second' } });
  input.dispatchEvent(new FocusEvent('blur'));
  await new Promise((resolve) => setTimeout(resolve, 350));
  expect(onchange.mock.calls.some(([event]) => Object.values(event.data).includes('queued'))).toBe(
    false,
  );
});

for (const replacement of [
  'readonly',
  'disabled',
  'data',
  'schema',
  'restored',
  'locale',
] as const) {
  it(`rechecks a queued native enum clear after ${replacement} changes`, async () => {
    const onchange = vi.fn();
    const capture = vi.fn();
    const element: ControlElement = { type: 'Control', scope: '#', options: { clearable: true } };
    const schema = { type: 'string', enum: ['stored', 'replacement'] };
    const view = await render(JsonForms, {
      props: {
        schema,
        data: 'stored',
        uischema: element,
        renderers: [enumEntry],
        onchange,
        config: {
          separateReadonlyFromDisabled: true,
          skeleton: { Combobox: { onclickcapture: capture } },
        },
      },
    });
    await vi.waitFor(() => expect(onchange).toHaveBeenCalled());
    onchange.mockClear();
    const clear = view.container.querySelector<HTMLButtonElement>(
      'button[aria-label="Clear value"]',
    )!;
    expect(clear).toBeTruthy();
    clear.click();
    expect(capture).toHaveBeenCalledTimes(1);
    if (replacement === 'readonly' || replacement === 'restored') {
      await view.rerender({ readonly: true });
      if (replacement === 'restored') await view.rerender({ readonly: false });
    }
    if (replacement === 'disabled')
      await view.rerender({
        uischema: {
          ...element,
          rule: { effect: RuleEffect.DISABLE, condition: { scope: '#', schema: {} } },
        },
      });
    if (replacement === 'data') await view.rerender({ data: 'replacement' });
    if (replacement === 'schema') await view.rerender({ schema: { ...schema, minLength: 2 } });
    if (replacement === 'locale') await view.rerender({ i18n: { locale: 'bg' } });
    await new Promise((resolve) => setTimeout(resolve, 350));
    const cleared = onchange.mock.calls.some(
      ([event]) => event.data === undefined || event.data === '',
    );
    expect(cleared).toBe(replacement === 'locale');
  });
}
