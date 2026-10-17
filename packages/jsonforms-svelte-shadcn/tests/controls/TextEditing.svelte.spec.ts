import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';
import { shadcnRenderers } from '../../src/lib';

afterEach(cleanup);

for (const variant of ['text', 'multiline', 'password']) {
  const multiline = variant === 'multiline';
  function mount(data = '', restrict = true) {
    const onchange = vi.fn();
    const onvaliditychange = vi.fn();
    const view = render(JsonForms, {
      props: {
        schema: { type: 'string', maxLength: 1 },
        data,
        uischema: {
          type: 'Control',
          scope: '#',
          options: {
            multi: multiline,
            restrict,
            ...(variant === 'password' ? { format: 'password' } : {}),
          },
        },
        renderers: shadcnRenderers,
        onchange,
        onvaliditychange,
      },
    });
    const input = view.container.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      multiline ? 'textarea' : 'input',
    )!;
    return { view, input, onchange, onvaliditychange };
  }
  function edit(input: HTMLInputElement | HTMLTextAreaElement, value: string, isComposing = false) {
    input.value = value;
    input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing }));
  }
  it(`uses code-point limits for ${variant} completed edits`, async () => {
    const { input, onchange } = mount();
    expect(input.hasAttribute('maxlength')).toBe(false);
    edit(input, '😀x');
    input.dispatchEvent(new FocusEvent('blur'));
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toBe('😀'));
    expect(input.value).toBe('😀');
    edit(input, 'e\u0301');
    input.dispatchEvent(new FocusEvent('blur'));
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toBe('e'));
  });
  it(`preserves ${variant} composition and blocks combined validity`, async () => {
    const { input, onchange, onvaliditychange } = mount();
    await vi.waitFor(() => expect(onchange).toHaveBeenCalled());
    onchange.mockClear();
    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    edit(input, 'にほ', true);
    input.dispatchEvent(new FocusEvent('blur'));
    await vi.waitFor(() => expect(onvaliditychange.mock.lastCall?.[0].pending).toBe(true));
    expect(onchange).not.toHaveBeenCalled();
    expect(input.value).toBe('にほ');
    input.value = '日';
    input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    edit(input, '日');
    input.dispatchEvent(new FocusEvent('blur'));
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toBe('日'));
    expect(onchange).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => expect(onvaliditychange.mock.lastCall?.[0].pending).toBe(false));
  });
  it(`cancels pending ${variant} edits on host replacement`, async () => {
    const { view, input, onchange } = mount();
    edit(input, 'a');
    await view.rerender({ data: 'b' });
    input.dispatchEvent(new FocusEvent('blur'));
    await vi.waitFor(() => expect(input.value).toBe('b'));
    expect(onchange.mock.calls.some(([event]) => event.data === 'a')).toBe(false);
  });
  it(`preserves typing across its own ${variant} commit feedback`, async () => {
    const { input, onchange } = mount('', false);
    edit(input, 'a');
    input.dispatchEvent(new FocusEvent('blur'));
    edit(input, 'ab');
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toBe('a'));
    expect(input.value).toBe('ab');
    input.dispatchEvent(new FocusEvent('blur'));
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toBe('ab'));
  });
  it(`revokes pending ${variant} edits when readonly changes`, async () => {
    const { view, input, onchange } = mount();
    edit(input, 'a');
    await view.rerender({ readonly: true });
    input.dispatchEvent(new FocusEvent('blur'));
    expect(input.value).toBe('');
    expect(onchange.mock.calls.some(([event]) => event.data === 'a')).toBe(false);
  });
  it(`keeps native ${variant} readonly focusable without exposing mutation actions`, async () => {
    const { view, input, onchange } = mount('a');
    await view.rerender({ readonly: true, config: { separateReadonlyFromDisabled: true } });
    expect(input.disabled).toBe(false);
    expect(input.readOnly).toBe(true);
    expect(view.container.querySelector('button[aria-label="Clear value"]')).toBeNull();
    input.focus();
    expect(document.activeElement).toBe(input);
    onchange.mockClear();
    edit(input, 'b');
    input.dispatchEvent(new FocusEvent('blur'));
    expect(input.value).toBe('a');
    expect(onchange).not.toHaveBeenCalled();
  });
  it(`clearing supersedes queued ${variant} input`, async () => {
    const { view, input, onchange } = mount('a');
    input.focus();
    edit(input, 'b');
    await view.getByRole('button', { name: 'Clear value', exact: true }).click();
    await vi.waitFor(() => expect(input.value).toBe(''));
    expect(onchange.mock.calls.some(([event]) => event.data === 'b')).toBe(false);
  });
  it(`preserves text after a restricted ${variant} insertion and its caret`, async () => {
    const { view, input, onchange } = mount('abc');
    await view.rerender({ schema: { type: 'string', maxLength: 3 } });
    input.focus();
    input.value = 'a😀bc';
    input.setSelectionRange(3, 3);
    input.dispatchEvent(
      new InputEvent('input', { bubbles: true, inputType: 'insertText', data: '😀' }),
    );
    expect(input.value).toBe('abc');
    expect(input.selectionStart).toBe(1);
    input.dispatchEvent(new FocusEvent('blur'));
    expect(onchange.mock.calls.some(([event]) => event.data === 'a😀b')).toBe(false);
    await view.rerender({ schema: { type: 'string', maxLength: 1 }, data: '😀' });
    input.value = '😁😀';
    input.setSelectionRange(2, 2);
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    expect(input.value).toBe('😀');
    expect(input.selectionStart).toBe(0);
  });
  it(`preserves invalid imported ${variant} values and allows correction`, async () => {
    const { input, onchange } = mount('abc');
    expect(input.value).toBe('abc');
    edit(input, 'ab');
    input.dispatchEvent(new FocusEvent('blur'));
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toBe('ab'));
    expect(input.value).toBe('ab');
  });
  it(`keeps unrestricted ${variant} edits`, async () => {
    const { input, onchange } = mount('', false);
    edit(input, '😀ab');
    input.dispatchEvent(new FocusEvent('blur'));
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toBe('😀ab'));
  });
}

it('keeps suggested free text provisional during IME composition', async () => {
  const onchange = vi.fn();
  const view = render(JsonForms, {
    props: {
      schema: { anyOf: [{ enum: ['A', 'B'] }, { type: 'string' }], maxLength: 1 },
      data: 'A',
      uischema: { type: 'Control', scope: '#', options: { restrict: true } },
      renderers: shadcnRenderers,
      onchange,
    },
  });
  const input = view.container.querySelector<HTMLInputElement>('input')!;
  await vi.waitFor(() => expect(onchange).toHaveBeenCalled());
  onchange.mockClear();
  input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
  input.value = '😀x';
  input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
  expect(onchange).not.toHaveBeenCalled();
  input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toBe('😀'));
  expect(input.value).toBe('😀');
});
