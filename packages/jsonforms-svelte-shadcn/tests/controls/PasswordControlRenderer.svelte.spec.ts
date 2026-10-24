import { clearAllIds, type Translator } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { tick } from 'svelte';
import { userEvent } from 'vitest/browser';
import { cleanup } from 'vitest-browser-svelte';
import { entry as passwordControlRendererEntry } from '../../src/lib/controls/PasswordControlRenderer.entry';
import {
  expectLabelVisible,
  expectValidationError,
  getBySelector,
  mountControl,
  mountForm,
  waitForChange,
} from '../testUtils';

describe('PasswordControlRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(async () => {
    await cleanup();
  });

  const renderers = [passwordControlRendererEntry];

  it('localizes reveal and clear actions and preserves leading zeroes', async () => {
    const { view, onchange } = await mountForm({
      renderers,
      schema: { type: 'object', properties: { value: { type: 'string' } } },
      uischema: {
        type: 'Control',
        scope: '#/properties/value',
        options: { format: 'password', clearable: true },
      },
      data: { value: '001234' },
      i18n: { locale: 'bg' },
    });
    const input = getBySelector<HTMLInputElement>(view.container, 'input[id$="-input"]');
    expect(input.type).toBe('password');
    const reveal = getBySelector<HTMLButtonElement>(
      view.container,
      'button[aria-label="Показване на паролата"]',
    );
    reveal.click();
    await tick();
    expect(input.type).toBe('text');
    expect(input.value).toBe('001234');
    expect(reveal.getAttribute('aria-pressed')).toBe('true');
    expect(reveal.getAttribute('aria-label')).toBe('Скриване на паролата');
    const before = onchange.mock.calls.length;
    getBySelector<HTMLButtonElement>(
      view.container,
      'button[aria-label="Изчистване на стойността"]',
    ).click();
    const change = await waitForChange(onchange, before);
    expect(change.data.value ?? '').toBe('');
  });

  it('renders password input when no data is provided', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { type: 'string', format: 'password', title: 'Password' },
      options: { placeholder: 'Enter password' },
    });

    const input = getBySelector<HTMLInputElement>(view.container, 'input[id$="-input"]');
    expect(input.type).toBe('password');
    expect(input.value).toBe('');
    expect(input.getAttribute('placeholder')).toBe('Enter password');
    expectLabelVisible(view.container, 'Password');
  });

  it('updates core data on input', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: { type: 'string', format: 'password' },
      value: 'secret',
    });

    const input = getBySelector<HTMLInputElement>(view.container, 'input[id$="-input"]');
    expect(input.value).toBe('secret');
    const before = onchange.mock.calls.length;
    input.value = 'new-secret';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const changeEvent = await waitForChange(onchange, before);

    expect(changeEvent.data.value).toBe('new-secret');
  });

  it('renders validation error for invalid value', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { type: 'string', format: 'password', minLength: 8 },
      value: 'short',
      required: true,
    });

    expectValidationError(view.container);
  });
  it.each([false, true])(
    'keeps reveal presentation-only with a localized native tooltip (OTP=%s)',
    async (otp) => {
      const { view, onchange } = await mountForm({
        renderers,
        schema: { type: 'string', format: 'password', minLength: 4, maxLength: 6 },
        uischema: { type: 'Control', scope: '#', options: { variant: otp ? 'otp' : undefined } },
        data: '001234',
        i18n: { locale: 'bg' },
      });
      await tick();
      const toggle = getBySelector<HTMLButtonElement>(
        view.container,
        'button[aria-label="Показване на паролата"]',
      );
      const before = onchange.mock.calls.length;
      toggle.focus();
      await userEvent.tab({ shift: true });
      await userEvent.tab();
      await expect
        .poll(() => document.querySelector('[data-tooltip-content]')?.textContent?.trim(), {
          timeout: 3000,
        })
        .toBe('Показване на паролата');
      toggle.click();
      await tick();
      expect(toggle.getAttribute('aria-label')).toBe('Скриване на паролата');
      expect(toggle.getAttribute('aria-pressed')).toBe('true');
      expect(view.container.querySelector('input')?.type).toBe('text');
      expect(onchange.mock.calls.length).toBe(before);
      expect(toggle.parentElement?.closest('button, [role="button"]')).toBeNull();
      await view.rerender({
        i18n: {
          locale: 'fr-CA',
          translate: ((key: string, fallback?: string) =>
            key === 'password.hide' ? 'Masquer le secret' : fallback) as Translator,
        },
      });
      expect(toggle.getAttribute('aria-label')).toBe('Masquer le secret');
      await userEvent.tab({ shift: true });
      await userEvent.tab();
      await expect
        .poll(() => document.querySelector('[data-tooltip-content]')?.textContent?.trim(), {
          timeout: 3000,
        })
        .toBe('Masquer le secret');
      await view.rerender({ readonly: true });
      expect(toggle.disabled).toBe(true);
      toggle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await tick();
      expect(toggle.getAttribute('aria-pressed')).toBe('true');
      expect(onchange.mock.calls.length).toBe(before);
    },
  );
});
