import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import { userEvent } from 'vitest/browser';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { shadcnRenderers } from '../../src/lib/renderers';
import { shadcnCells } from '../../src/lib/cells';
import { waitForChange } from '../testUtils';

afterEach(cleanup);
const password = { type: 'string', format: 'password', minLength: 4, maxLength: 6 };

it('reveals partial-code validation after a completed edit when untouched errors are filtered', async () => {
  const { view, inputs } = setup();
  await view.rerender({
    config: {
      enableFilterErrorsBeforeTouch: true,
      filterErrorKeywordsBeforeTouch: ['minLength'],
    },
  });
  const input = inputs()[0];
  expect(input.getAttribute('aria-invalid')).toBe('false');
  input.value = '007';
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await vi.waitFor(() => expect(input.getAttribute('aria-invalid')).toBe('true'));
});

function setup(data: unknown = '00', schema = password, readonly = false, table = false) {
  const onchange = vi.fn();
  const onvaliditychange = vi.fn();
  const view = render(JsonForms, {
    props: {
      schema: table
        ? { type: 'array', items: { type: 'object', properties: { code: schema } } }
        : schema,
      uischema: {
        type: 'Control',
        scope: '#',
        options: table
          ? {
              table: true,
              detail: {
                type: 'VerticalLayout',
                elements: [
                  { type: 'Control', scope: '#/properties/code', options: { variant: 'otp' } },
                ],
              },
            }
          : { variant: 'otp' },
      },
      data: table ? [{ code: data }] : data,
      renderers: shadcnRenderers,
      cells: shadcnCells,
      readonly,
      onchange,
      onvaliditychange,
    },
  });
  return {
    view,
    onchange,
    onvaliditychange,
    inputs: () => Array.from(view.container.querySelectorAll('input')),
  };
}
it('uses native shadcn Input OTP slots and commits partial string codes without dropping zeroes', async () => {
  const { view, inputs, onchange } = setup();
  await tick();
  expect(view.container.querySelectorAll('[data-slot="input-otp-slot"]')).toHaveLength(6);
  expect(view.container.querySelector('[data-slot="input-otp-group"]')).toBeTruthy();
  expect(inputs()).toHaveLength(1);
  const input = inputs()[0];
  expect(input.type).toBe('password');
  expect(input.value).toBe('00');
  let before = onchange.mock.calls.length;
  input.value = '007';
  input.dispatchEvent(new InputEvent('input', { bubbles: true, data: '7' }));
  expect((await waitForChange(onchange, before)).data).toBe('007');
  const clipboardData = new DataTransfer();
  clipboardData.setData('text', '001234');
  input.focus();
  input.setSelectionRange(0, input.value.length);
  before = onchange.mock.calls.length;
  input.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, clipboardData }));
  expect((await waitForChange(onchange, before)).data).toBe('001234');
  expect(view.container.textContent).not.toContain('001234');
});
it('falls back for missing bounds and retains oversized imported data', async () => {
  const first = setup('001234567');
  await tick();
  expect(first.inputs()).toHaveLength(1);
  expect(first.inputs()[0].value).toBe('001234567');
  cleanup();
  const second = setup('0012', { type: 'string', format: 'password' } as typeof password);
  await tick();
  expect(second.inputs()).toHaveLength(1);
  expect(second.inputs()[0].type).toBe('password');
});
it('guards synthetic mutations when readonly', async () => {
  const { inputs, onchange } = setup('0012', password, true);
  await tick();
  expect(inputs()).toHaveLength(1);
  expect(inputs().every((input) => input.disabled)).toBe(true);
  const before = onchange.mock.calls.length;
  inputs()[0].value = '9';
  inputs()[0].dispatchEvent(new InputEvent('input', { bubbles: true }));
  await tick();
  expect(onchange.mock.calls.length).toBe(before);
});
it('keeps a single masked password input in table cells', async () => {
  const { inputs } = setup('0012', password, false, true);
  await tick();
  const passwords = inputs().filter((input) => input.type === 'password');
  expect(passwords).toHaveLength(1);
  expect(passwords[0].value).toBe('0012');
});

it('keeps native slots masked through replacement and supports reveal and clearing', async () => {
  const { view, inputs, onchange } = setup('001234');
  const slots = () => Array.from(view.container.querySelectorAll('[data-slot="input-otp-slot"]'));
  await expect
    .poll(() =>
      slots()
        .map((slot) => slot.textContent?.trim())
        .join(''),
    )
    .toBe('••••••');
  await view.rerender({ data: 'AB09' });
  await expect.poll(() => inputs()[0].value).toBe('AB09');
  await expect
    .poll(() =>
      slots()
        .map((slot) => slot.textContent?.trim())
        .join(''),
    )
    .toBe('••••');
  await view.getByRole('button', { name: 'Show password', exact: true }).click();
  expect(inputs()[0].type).toBe('text');
  expect(
    slots()
      .map((slot) => slot.textContent?.trim())
      .join(''),
  ).toBe('AB09');
  await view.getByRole('button', { name: 'Hide password', exact: true }).click();
  expect(inputs()[0].type).toBe('password');
  const before = onchange.mock.calls.length;
  await view.getByRole('button', { name: 'Clear value', exact: true }).click();
  expect((await waitForChange(onchange, before)).data).toBeUndefined();
  await expect
    .poll(() =>
      slots()
        .map((slot) => slot.textContent?.trim())
        .join(''),
    )
    .toBe('');
});

it('keeps native readonly OTP focusable without allowing form mutations', async () => {
  const { view, inputs, onchange } = setup();
  await view.rerender({ readonly: true, config: { separateReadonlyFromDisabled: true } });
  const input = inputs()[0];
  expect(input.readOnly).toBe(true);
  expect(input.disabled).toBe(false);
  input.focus();
  expect(document.activeElement).toBe(input);
  expect(view.container.querySelector('button[aria-label="Clear value"]')).toBeNull();
  onchange.mockClear();
  input.value = '9';
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await tick();
  expect(onchange).not.toHaveBeenCalled();
});

it('holds native OTP composition pending and renders whole Unicode code points in six slots', async () => {
  const { view, inputs, onchange, onvaliditychange } = setup();
  const input = inputs()[0];
  input.focus();
  onchange.mockClear();
  input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
  input.value = '00にほ';
  input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
  await vi.waitFor(() => expect(onvaliditychange.mock.lastCall?.[0].pending).toBe(true));
  expect(onchange).not.toHaveBeenCalled();
  input.value = '00日😀';
  input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toBe('00日😀'));
  expect(onvaliditychange.mock.lastCall?.[0].pending).toBe(false);
  await view.getByRole('button', { name: 'Show password', exact: true }).click();
  const slots = view.container.querySelectorAll('[data-slot="input-otp-slot"]');
  expect(slots).toHaveLength(6);
  expect(Array.from(slots).map((slot) => slot.textContent?.trim())).toEqual([
    '0',
    '0',
    '日',
    '😀',
    '',
    '',
  ]);
});

it('pastes six supplementary characters without splitting them or adding slots', async () => {
  const { view, inputs, onchange } = setup();
  const input = inputs()[0];
  input.focus();
  input.select();
  const clipboardData = new DataTransfer();
  clipboardData.setData('text/plain', '😀'.repeat(7));
  input.dispatchEvent(
    new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData }),
  );
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toBe('😀'.repeat(6)));
  expect(view.container.querySelectorAll('[data-slot="input-otp-slot"]')).toHaveLength(6);
  await vi.waitFor(() => expect([input.selectionStart, input.selectionEnd]).toEqual([10, 12]));
});

for (const replacement of ['data', 'schema', 'readonly'] as const) {
  it(`cancels native OTP composition after ${replacement} replacement`, async () => {
    const { view, inputs, onchange, onvaliditychange } = setup();
    const input = inputs()[0];
    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    input.value = '00にほ';
    input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
    await vi.waitFor(() => expect(onvaliditychange.mock.lastCall?.[0].pending).toBe(true));
    await view.rerender(
      replacement === 'data'
        ? { data: '0099' }
        : replacement === 'schema'
          ? { schema: { ...password, title: 'New code' } }
          : { readonly: true },
    );
    await vi.waitFor(() => expect(onvaliditychange.mock.lastCall?.[0].pending).toBe(false));
    onchange.mockClear();
    input.value = '00日';
    input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    await tick();
    expect(onchange).not.toHaveBeenCalled();
    expect(input.value).toBe(replacement === 'data' ? '0099' : '00');
  });
}

it('replaces a whole supplementary character with native keyboard input', async () => {
  const { inputs, onchange } = setup('00😀12');
  const input = inputs()[0];
  input.focus();
  // Bits may select one UTF-16 unit; the adapter expands that selection to the code point.
  input.setSelectionRange(2, 3);
  document.dispatchEvent(new Event('selectionchange'));
  await vi.waitFor(() => expect([input.selectionStart, input.selectionEnd]).toEqual([2, 4]));
  await userEvent.keyboard('9');
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toBe('00912'));
});

it('clears pending OTP ownership when the same control switches to ordinary password', async () => {
  const { view, inputs, onchange, onvaliditychange } = setup();
  const input = inputs()[0];
  input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
  await vi.waitFor(() => expect(onvaliditychange.mock.lastCall?.[0].pending).toBe(true));
  await view.rerender({ uischema: { type: 'Control', scope: '#' } });
  await vi.waitFor(() => expect(onvaliditychange.mock.lastCall?.[0].pending).toBe(false));
  onchange.mockClear();
  input.value = '00日';
  input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
  await tick();
  expect(onchange).not.toHaveBeenCalled();
  expect(inputs()[0].value).toBe('00');
});

for (const imported of [null, 12, false, { secret: 'retained' }, ['retained']]) {
  it(`preserves incompatible imported OTP data ${JSON.stringify(imported)} until an edit`, async () => {
    const { view, inputs, onchange } = setup(imported);
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual(imported));
    expect(inputs()).toHaveLength(1);
    expect(inputs()[0].type).toBe('password');
    onchange.mockClear();
    await view.getByRole('button', { name: 'Show password', exact: true }).click();
    expect(onchange).not.toHaveBeenCalled();
    const input = inputs()[0];
    input.value = '0012';
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    input.dispatchEvent(new FocusEvent('blur'));
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toBe('0012'));
  });
}
