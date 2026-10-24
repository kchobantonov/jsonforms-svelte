import { page } from 'vite-plus/test/browser';
import '../test.css';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { skeletonRenderers } from '../../src/lib/renderers';
import { skeletonCells } from '../../src/lib/cells';
import { waitForChange } from '../testUtils';

afterEach(cleanup);
const password = { type: 'string', format: 'password', minLength: 4, maxLength: 6 };
async function setup(
  data: unknown = '00',
  schema = password,
  readonly = false,
  table = false,
  focus?: boolean,
) {
  const onchange = vi.fn();
  const onvaliditychange = vi.fn();
  const view = await render(JsonForms, {
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
          : { variant: 'otp', focus },
      },
      data: table ? [{ code: data }] : data,
      renderers: skeletonRenderers,
      cells: skeletonCells,
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
it('commits partial string codes, pastes leading zeroes, and supports keyboard navigation', async () => {
  const { inputs, onchange } = await setup();
  await tick();
  expect(inputs()).toHaveLength(6);
  expect(
    inputs()
      .map((input) => input.value)
      .join(''),
  ).toBe('00');
  expect(inputs().every((input) => input.type === 'password')).toBe(true);
  let before = onchange.mock.calls.length;
  inputs()[2].value = '7';
  inputs()[2].dispatchEvent(new InputEvent('input', { bubbles: true, data: '7' }));
  expect((await waitForChange(onchange, before)).data).toBe('007');
  await tick();
  expect(document.activeElement).toBe(inputs()[3]);
  const clipboardData = new DataTransfer();
  clipboardData.setData('text', '001234');
  before = onchange.mock.calls.length;
  inputs()[0].dispatchEvent(new ClipboardEvent('paste', { bubbles: true, clipboardData }));
  expect((await waitForChange(onchange, before)).data).toBe('001234');
  inputs()[5].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
  await tick();
  expect(document.activeElement).toBe(inputs()[0]);
  inputs()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  await tick();
  expect(document.activeElement).toBe(inputs()[1]);
});
it('falls back for missing bounds and retains oversized imported data', async () => {
  const first = await setup('001234567');
  await tick();
  expect(first.inputs()).toHaveLength(1);
  expect(first.inputs()[0].value).toBe('001234567');
  await cleanup();
  const second = await setup('0012', { type: 'string', format: 'password' } as typeof password);
  await tick();
  expect(second.inputs()).toHaveLength(1);
  expect(second.inputs()[0].type).toBe('password');
});
it('guards synthetic mutations when readonly', async () => {
  const { inputs, onchange } = await setup('0012', password, true);
  await tick();
  expect(inputs()).toHaveLength(6);
  expect(inputs().every((input) => input.disabled)).toBe(true);
  const before = onchange.mock.calls.length;
  inputs()[0].value = '9';
  inputs()[0].dispatchEvent(new InputEvent('input', { bubbles: true }));
  await tick();
  expect(onchange.mock.calls.length).toBe(before);
});
it('keeps a single masked password input in table cells', async () => {
  const { inputs } = await setup('0012', password, false, true);
  await tick();
  const passwords = inputs().filter((input) => input.type === 'password');
  expect(passwords).toHaveLength(1);
  expect(passwords[0].value).toBe('0012');
});

it('keeps OTP composition pending, preserves code points and commits the completed edit once', async () => {
  const { inputs, onchange, onvaliditychange } = await setup();
  await vi.waitFor(() => expect(onchange).toHaveBeenCalled());
  onchange.mockClear();
  const input = inputs()[2];
  input.focus();
  input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
  input.value = 'にほ';
  input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
  input.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, isComposing: true }),
  );
  input.dispatchEvent(new FocusEvent('blur'));
  await vi.waitFor(() => expect(onvaliditychange.mock.lastCall?.[0].pending).toBe(true));
  expect(document.activeElement).toBe(input);
  expect(input.value).toBe('にほ');
  expect(onchange).not.toHaveBeenCalled();
  input.value = '日😀';
  input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toBe('00日😀'));
  expect(onchange).toHaveBeenCalledTimes(1);
  await vi.waitFor(() => expect(onvaliditychange.mock.lastCall?.[0].pending).toBe(false));
  expect(
    inputs()
      .map((input) => input.value)
      .join(''),
  ).toBe('00日😀');
  expect(document.activeElement).toBe(inputs()[4]);
});

it('cancels OTP composition on host replacement and rejects its late completion', async () => {
  const { view, inputs, onchange, onvaliditychange } = await setup();
  const input = inputs()[2];
  input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
  input.value = 'にほ';
  input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
  await vi.waitFor(() => expect(onvaliditychange.mock.lastCall?.[0].pending).toBe(true));
  await view.rerender({ data: '0099' });
  await vi.waitFor(() => expect(onvaliditychange.mock.lastCall?.[0].pending).toBe(false));
  onchange.mockClear();
  input.value = '日';
  input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
  await tick();
  expect(input.value).toBe('9');
  expect(
    inputs()
      .map((input) => input.value)
      .join(''),
  ).toBe('0099');
  expect(onchange).not.toHaveBeenCalled();
});

it('clears pending OTP ownership when the editor is removed', async () => {
  const { view, inputs, onvaliditychange } = await setup();
  inputs()[2].dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
  await vi.waitFor(() => expect(onvaliditychange.mock.lastCall?.[0].pending).toBe(true));
  await view.rerender({ uischema: { type: 'VerticalLayout', elements: [] } });
  await vi.waitFor(() => expect(onvaliditychange.mock.lastCall?.[0].pending).toBe(false));
});

it('keeps readonly OTP boxes focusable without permitting edits', async () => {
  const { view, inputs, onchange, onvaliditychange } = await setup();
  await view.rerender({ readonly: true, config: { separateReadonlyFromDisabled: true } });
  expect(inputs().every((input) => input.readOnly && !input.disabled)).toBe(true);
  expect(view.container.querySelector('button[aria-label="Clear value"]')).toBeNull();
  onchange.mockClear();
  const input = inputs()[0];
  input.focus();
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  await tick();
  expect(document.activeElement).toBe(inputs()[1]);
  input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
  input.value = 'x';
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
  await tick();
  // Native readonly prevents user edits; synthetic events must also leave form data unchanged.
  expect(onchange).not.toHaveBeenCalled();
  expect(onvaliditychange.mock.lastCall?.[0].pending).toBe(false);
});

it('limits OTP paste by code points without splitting supplementary characters', async () => {
  const { inputs, onchange } = await setup();
  const clipboardData = new DataTransfer();
  clipboardData.setData('text', '😀'.repeat(7));
  inputs()[0].dispatchEvent(
    new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData }),
  );
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toBe('😀'.repeat(6)));
  expect(inputs()).toHaveLength(6);
  expect(inputs().every((input) => input.value === '😀')).toBe(true);
});

for (const replacement of ['schema', 'readonly'] as const) {
  it(`cancels pending OTP composition after ${replacement} replacement`, async () => {
    const { view, inputs, onchange, onvaliditychange } = await setup();
    const input = inputs()[2];
    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    await vi.waitFor(() => expect(onvaliditychange.mock.lastCall?.[0].pending).toBe(true));
    await view.rerender(
      replacement === 'schema'
        ? { schema: { ...password, title: 'New code' } }
        : { readonly: true },
    );
    await vi.waitFor(() => expect(onvaliditychange.mock.lastCall?.[0].pending).toBe(false));
    onchange.mockClear();
    input.value = '日';
    input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    await tick();
    expect(onchange).not.toHaveBeenCalled();
  });
}

for (const imported of [null, 12, false, { secret: 'retained' }, ['retained']]) {
  it(`preserves incompatible imported OTP data ${JSON.stringify(imported)} until an edit`, async () => {
    const { view, inputs, onchange } = await setup(imported);
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

it('fits six native OTP boxes beside their actions at a narrow width', async () => {
  const { view, inputs } = await setup('001234');
  view.container.style.width = '266px';
  await tick();
  const boxes = Array.from(
    view.container.querySelectorAll<HTMLElement>('[data-slot="input-otp-slot"]'),
  );
  const fields = boxes.length ? boxes : inputs();
  const reveal = view.container.querySelector<HTMLElement>('button[aria-label="Show password"]')!;
  expect(fields).toHaveLength(6);
  for (const field of fields)
    expect(field.getBoundingClientRect().width).toBeGreaterThanOrEqual(24);
  expect(fields[5].getBoundingClientRect().right).toBeLessThanOrEqual(
    reveal.getBoundingClientRect().left,
  );
  view.container.style.width = '700px';
  await tick();
  expect(
    reveal.getBoundingClientRect().left - fields[5].getBoundingClientRect().right,
  ).toBeLessThanOrEqual(12);
});

it('honors authored initial focus on exactly one native OTP input', async () => {
  const { inputs } = await setup('00', password, false, false, true);
  expect(inputs().filter((input) => input.autofocus)).toHaveLength(1);
  await vi.waitFor(() => expect(document.activeElement).toBe(inputs()[0]));
});

it('reveals OTP clear only for its own hover or focus, retaining keyboard access', async () => {
  const { view, inputs } = await setup('12');
  await tick();
  view.container.style.padding = '40px';
  view.container.classList.add('group');
  const clear = view.container.querySelector<HTMLButtonElement>(
    'button[aria-label="Clear value"]',
  )!;
  await page.elementLocator(view.container).hover({ position: { x: 1, y: 1 } });
  inputs()[0].blur();
  await expect.poll(() => getComputedStyle(clear).visibility).toBe('hidden');
  inputs()[0].focus();
  await expect.poll(() => getComputedStyle(clear).visibility).toBe('visible');
  clear.focus();
  await expect.poll(() => getComputedStyle(clear).visibility).toBe('visible');
  clear.blur();
  await expect.poll(() => getComputedStyle(clear).visibility).toBe('hidden');
  await page.elementLocator(inputs()[0]).hover();
  await expect.poll(() => getComputedStyle(clear).visibility).toBe('visible');
});
