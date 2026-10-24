import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { afterEach, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-svelte';
import { shadcnRenderers, shadcnCells } from '../../src/lib';

afterEach(cleanup);

async function mount() {
  const onchange = vi.fn();
  const onvaliditychange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: { code: { type: 'string', maxLength: 2 }, other: { type: 'string' } },
        },
      },
      data: [
        { code: 'a', other: 'keep' },
        { code: 'b', other: 'second' },
      ],
      uischema: { type: 'Control', scope: '#', options: { table: true } },
      config: { restrict: true, separateReadonlyFromDisabled: true },
      renderers: shadcnRenderers,
      cells: shadcnCells,
      onchange,
      onvaliditychange,
    },
  });
  const input = view.container.querySelector<HTMLInputElement>('tbody input[type="text"]')!;
  return { view, input, onchange, onvaliditychange };
}

it('keeps table-cell IME provisional, preserves siblings and commits Unicode once', async () => {
  const { view, input, onchange, onvaliditychange } = await mount();
  await vi.waitFor(() => expect(onchange).toHaveBeenCalled());
  onchange.mockClear();
  input.focus();
  input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
  input.value = 'にほん';
  input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
  input.dispatchEvent(new FocusEvent('blur'));
  await vi.waitFor(() => expect(onvaliditychange.mock.lastCall?.[0].pending).toBe(true));
  expect(onchange).not.toHaveBeenCalled();
  expect(input.value).toBe('にほん');
  input.value = '日本';
  input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  input.dispatchEvent(new FocusEvent('blur'));
  await vi.waitFor(() =>
    expect(onchange.mock.lastCall?.[0].data).toEqual([
      { code: '日本', other: 'keep' },
      { code: 'b', other: 'second' },
    ]),
  );
  expect(onchange).toHaveBeenCalledTimes(1);
  await vi.waitFor(() => expect(onvaliditychange.mock.lastCall?.[0].pending).toBe(false));
  expect(view.container.contains(input)).toBe(true);
  expect(document.activeElement).toBe(input);
});

it('discards a queued cell edit when the host replaces its row and keeps readonly text inspectable', async () => {
  const { view, input, onchange } = await mount();
  input.value = 'zz';
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  const replacement = [
    { code: 'x', other: 'replacement' },
    { code: 'b', other: 'second' },
  ];
  await view.rerender({ data: replacement, readonly: true });
  input.dispatchEvent(new FocusEvent('blur'));
  await vi.waitFor(() => expect(input.value).toBe('x'));
  expect(input.readOnly).toBe(true);
  expect(input.disabled).toBe(false);
  input.focus();
  expect(document.activeElement).toBe(input);
  expect(onchange.mock.calls.some(([event]) => event.data[0]?.code === 'zz')).toBe(false);
  expect(input.closest('td')!.querySelector('button[aria-label="Clear value"]')).toBeNull();
});

it('clears only the edited cell and cancels its pending value', async () => {
  const { input, onchange } = await mount();
  input.focus();
  input.value = 'zz';
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  const clear = input
    .closest('td')!
    .querySelector<HTMLButtonElement>('button[aria-label="Clear value"]')!;
  expect(clear).not.toBeNull();
  await page.elementLocator(clear).click();
  await vi.waitFor(() =>
    expect(onchange.mock.lastCall?.[0].data).toEqual([
      { other: 'keep' },
      { code: 'b', other: 'second' },
    ]),
  );
  expect(input.value).toBe('');
  expect(onchange.mock.calls.some(([event]) => event.data[0]?.code === 'zz')).toBe(false);
});
