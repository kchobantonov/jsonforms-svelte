import { clearAllIds } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { tick } from 'svelte';
import { cleanup } from 'vitest-browser-svelte';
import { entry as stringMaskControlRendererEntry } from '../../src/lib/controls/StringMaskControlRenderer.entry';
import {
  expectLabelVisible,
  expectValidationError,
  getBySelector,
  mountControl,
  waitForChange,
} from '../testUtils';

describe('StringMaskControlRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(async () => {
    await cleanup();
  });

  const renderers = [stringMaskControlRendererEntry];

  it('renders masked input when no data is provided', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { type: 'string', title: 'Masked Value' },
      options: { mask: '###-###', placeholder: '000-000' },
    });

    const input = getBySelector<HTMLInputElement>(view.container, 'input[id$="-input"]');
    expect(input.type).toBe('text');
    expect(input.getAttribute('placeholder')).toBe('000-000');
    expect(input.value).toBe('');
    expectLabelVisible(view.container, 'Masked Value');
  });

  it('updates core data from masked input', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: { type: 'string' },
      value: '123-456',
      options: { mask: '###-###', returnMaskedValue: true },
    });

    const input = getBySelector<HTMLInputElement>(view.container, 'input[id$="-input"]');
    expect(input.value).toBe('123-456');
    const before = onchange.mock.calls.length;
    input.value = '987-654';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const changeEvent = await waitForChange(onchange, before);

    expect(changeEvent.data.value).toBe('987-654');
  });

  it('updates core data from unmasked input when returnMaskedValue is false', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: { type: 'string' },
      value: '123-456',
      options: { mask: '###-###', returnMaskedValue: false },
    });

    const input = getBySelector<HTMLInputElement>(view.container, 'input[id$="-input"]');
    expect(input.value).toBe('123-456');
    const before = onchange.mock.calls.length;
    input.value = '987-654';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const changeEvent = await waitForChange(onchange, before);

    expect(changeEvent.data.value).toBe('987654');
  });

  it.each([
    [{ eager: true }, '123', '123-'],
    [{ eager: false }, '123', '123'],
    [{ reversed: true }, '123456789', '456-789'],
    [{ reversed: false }, '123456789', '123-456'],
  ])('honors explicit mask options %j', async (options, text, expected) => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: { type: 'string' },
      options: { mask: '###-###', returnMaskedValue: true, ...options },
    });
    const input = getBySelector<HTMLInputElement>(view.container, 'input[id$="-input"]');
    const before = onchange.mock.calls.length;
    input.value = text;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect((await waitForChange(onchange, before)).data.value).toBe(expected);
    expect(input.value).toBe(expected);
  });

  it('updates the native input mask in place and localizes its clear action', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: { type: 'string' },
      value: '123456',
      options: { mask: '###-###', clearable: true },
    });
    const input = getBySelector<HTMLInputElement>(view.container, 'input[id$="-input"]');
    await view.rerender({
      i18n: { locale: 'bg' },
      uischema: {
        type: 'Control',
        scope: '#/properties/value',
        options: { mask: '##/##/##', clearable: true },
      },
    });
    await tick();
    expect(view.container.querySelector('input[id$="-input"]')).toBe(input);
    expect(input.value).toBe('12/34/56');
    const before = onchange.mock.calls.length;
    getBySelector<HTMLButtonElement>(
      view.container,
      'button[aria-label="Изчистване на стойността"]',
    ).click();
    expect((await waitForChange(onchange, before)).data.value ?? '').toBe('');
  });

  it('preserves an imported value the mask cannot represent', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: { type: 'string' },
      value: 'PENDING-REVIEW',
      options: { mask: '###-###' },
    });
    await tick();
    const input = getBySelector<HTMLInputElement>(view.container, 'input[id$="-input"]');
    expect(input.value).toBe('PENDING-REVIEW');
    expect(onchange.mock.calls.every(([event]) => event.data.value === 'PENDING-REVIEW')).toBe(
      true,
    );
    const before = onchange.mock.calls.length;
    input.value = '123456';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect((await waitForChange(onchange, before)).data.value).toBe('123456');
    await tick();
    expect(input.value).toBe('123-456');
  });

  it('counts stored characters separately from separators and accepts Unicode token patterns', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: { type: 'string', maxLength: 6 },
      options: { mask: '###-###', restrict: true },
    });
    const input = getBySelector<HTMLInputElement>(view.container, 'input[id$="-input"]');
    expect(input.hasAttribute('maxlength')).toBe(false);
    let before = onchange.mock.calls.length;
    input.value = '123456';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect((await waitForChange(onchange, before)).data.value).toBe('123456');
    await view.rerender({
      data: { value: 'Сüd' },
      uischema: {
        type: 'Control',
        scope: '#/properties/value',
        options: { mask: 'AAAA', tokens: { A: '\\p{L}' } },
      },
    });
    await tick();
    expect(input.value).toBe('Сüd');
    before = onchange.mock.calls.length;
    input.value = 'Софя';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect((await waitForChange(onchange, before)).data.value).toBe('Софя');
  });

  it('renders validation error for invalid value', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { type: 'string', minLength: 7 },
      value: '12-3',
      options: { mask: '###-###', returnMaskedValue: true },
      required: true,
    });

    expectValidationError(view.container);
  });
  it('rejects stale input and clear actions when readonly remains enabled', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: { type: 'string' },
      value: '123456',
      options: { mask: '###-###', clearable: true },
    });
    const input = getBySelector<HTMLInputElement>(view.container, 'input[id$="-input"]');
    const clear = getBySelector<HTMLButtonElement>(
      view.container,
      'button[aria-label="Clear value"]',
    );
    await view.rerender({ readonly: true, config: { separateReadonlyFromDisabled: true } });
    await tick();
    const before = onchange.mock.calls.length;
    input.value = '987-654';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    clear.click();
    await tick();
    expect(onchange.mock.calls.length).toBe(before);
    expect(onchange.mock.lastCall?.[0].data.value).toBe('123456');
  });
  it('reports invalid token patterns without losing stored data and refreshes the diagnostic locale', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: { type: 'string' },
      value: '123456',
      options: { mask: '###-###', tokens: { '#': '[' } },
    });
    await tick();
    expect(view.container.textContent).toContain(
      'The input mask contains an invalid token definition.',
    );
    expect(onchange.mock.lastCall?.[0].data.value).toBe('123456');
    await view.rerender({ i18n: { locale: 'bg' } });
    await tick();
    expect(view.container.textContent).toContain(
      'Маската за въвеждане съдържа невалидна дефиниция на символ.',
    );
  });
  it('keeps IME drafts local and masks only the completed composition', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: { type: 'string' },
      value: '12',
      options: { mask: '###-###' },
    });
    const input = getBySelector<HTMLInputElement>(view.container, 'input[id$="-input"]');
    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    input.value = '1234';
    input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
    await tick();
    expect(input.value).toBe('1234');
    expect(onchange.mock.lastCall?.[0].data.value).toBe('12');
    input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    await tick();
    expect(input.value).toBe('123-4');
    expect(onchange.mock.lastCall?.[0].data.value).toBe('1234');
  });
  it('cancels composition after host replacement and does not restore stale text', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: { type: 'string' },
      value: '12',
      options: { mask: '###-###' },
    });
    const input = getBySelector<HTMLInputElement>(view.container, 'input[id$="-input"]');
    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    input.value = '1234';
    input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
    await view.rerender({ data: { value: '987654' } });
    await tick();
    input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    await tick();
    expect(input.value).toBe('987-654');
    expect(onchange.mock.lastCall?.[0].data.value).toBe('987654');
  });
  it('preserves the caret during a middle insertion and restricts the stored representation', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: { type: 'string', maxLength: 6 },
      value: '12345',
      options: { mask: '###-###', restrict: true },
    });
    const input = getBySelector<HTMLInputElement>(view.container, 'input[id$="-input"]');
    input.focus();
    input.value = '1293-45';
    input.setSelectionRange(3, 3);
    input.dispatchEvent(
      new InputEvent('input', { bubbles: true, inputType: 'insertText', data: '9' }),
    );
    await tick();
    expect(input.value).toBe('129-345');
    expect(input.selectionStart).toBe(3);
    expect(onchange.mock.lastCall?.[0].data.value).toBe('129345');
    expect(input.hasAttribute('maxlength')).toBe(false);
  });
  it('clears an unfinished composition without allowing its end event to restore data', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: { type: 'string' },
      value: '12',
      options: { mask: '###-###', clearable: true },
    });
    const input = getBySelector<HTMLInputElement>(view.container, 'input[id$="-input"]');
    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    input.value = '1234';
    input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
    getBySelector<HTMLButtonElement>(view.container, 'button[aria-label="Clear value"]').click();
    await tick();
    input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    await tick();
    expect(input.value).toBe('');
    expect(onchange.mock.lastCall?.[0].data.value ?? '').toBe('');
  });
  it('invalidates composition when the mask changes without changing the stored value', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: { type: 'string' },
      value: '12',
      options: { mask: '###-###' },
    });
    const input = getBySelector<HTMLInputElement>(view.container, 'input[id$="-input"]');
    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    input.value = '123456';
    input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
    await view.rerender({
      uischema: { type: 'Control', scope: '#/properties/value', options: { mask: '###/###' } },
    });
    await tick();
    input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    await tick();
    expect(input.value).toBe('12');
    expect(onchange.mock.lastCall?.[0].data.value).toBe('12');
  });
});
