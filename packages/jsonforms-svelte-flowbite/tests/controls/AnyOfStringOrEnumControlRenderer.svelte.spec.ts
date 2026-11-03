import { tick } from 'svelte';
import messages from '../../../jsonforms-svelte/src/lib/locales/messages.json';
import { clearAllIds, type JsonSchema } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import { entry as anyOfStringOrEnumControlRendererEntry } from '../../src/lib/controls/AnyOfStringOrEnumControlRenderer.entry';
import {
  expectLabelVisible,
  expectValidationError,
  getBySelector,
  mountControl,
  mountForm,
  waitForChange,
} from '../testUtils';

describe('AnyOfStringOrEnumControlRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(async () => {
    await cleanup();
  });

  const renderers = [anyOfStringOrEnumControlRendererEntry];
  const propertySchema: JsonSchema = {
    title: 'Any Value',
    anyOf: [{ enum: ['A', 'B'] }, { type: 'string', minLength: 3 }],
  };

  it('associates visible help with the free-text choice input', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { ...propertySchema, description: 'Free-text choice help' },
      options: { flowbite: { Input: { 'aria-describedby': 'author-help' } } },
    });
    const input = getBySelector<HTMLInputElement>(view.container, 'input[id$="-input"]');
    expect(input.getAttribute('aria-describedby')).toBe('author-help');
    input.focus();
    await tick();
    const helper = view.container.querySelector<HTMLElement>('[id$="-help"]');
    expect(helper?.textContent).toContain('Free-text choice help');
    expect(input.getAttribute('aria-describedby')?.split(' ')).toContain('author-help');
    expect(input.getAttribute('aria-describedby')?.split(' ')).toContain(helper?.id);
  });

  it('renders text input when no data is provided', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema,
      options: { placeholder: 'Select or type value' },
    });
    const input = getBySelector<HTMLInputElement>(view.container, 'input[id$="-input"]');
    expect(input.type).toBe('text');
    expect(input.value).toBe('');
    expect(input.getAttribute('placeholder')).toBe('Select or type value');
    expectLabelVisible(view.container, 'Any Value');
  });

  it('updates core data on input', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema,
      value: 'A',
    });

    const input = getBySelector<HTMLInputElement>(view.container, 'input[id$="-input"]');
    expect(input.value).toBe('A');
    const before = onchange.mock.calls.length;
    input.value = 'B';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const changeEvent = await waitForChange(onchange, before);

    expect(changeEvent.data.value).toBe('B');
  });

  it('selects resolved suggestion branches and preserves custom text', async () => {
    const { view, onchange } = await mountForm({
      renderers,
      schema: {
        type: 'object',
        $defs: {
          choices: { type: 'string', enum: ['A', 'AB'] },
          text: { type: 'string', minLength: 3 },
        },
        properties: {
          value: { anyOf: [{ $ref: '#/$defs/choices' }, { $ref: '#/$defs/text' }] },
        },
      } as JsonSchema,
      uischema: { type: 'Control', scope: '#/properties/value' },
      data: { value: 'A' },
    });
    const input = getBySelector<HTMLInputElement>(view.container, 'input[id$="-input"]');
    input.focus();
    await tick();
    expect(
      [...view.container.querySelectorAll('button')].some(
        (button) => button.textContent?.trim() === 'A',
      ),
    ).toBe(true);
    expect(
      [...view.container.querySelectorAll('button')].some(
        (button) => button.textContent?.trim() === 'AB',
      ),
    ).toBe(true);
    const beforeSelect = onchange.mock.calls.length;
    [...view.container.querySelectorAll('button')]
      .find((button) => button.textContent?.trim() === 'AB')!
      .click();
    expect((await waitForChange(onchange, beforeSelect)).data.value).toBe('AB');
    expect(input.value).toBe('AB');
    const before = onchange.mock.calls.length;
    input.value = 'custom';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect((await waitForChange(onchange, before)).data.value).toBe('custom');
    const beforeInvalid = onchange.mock.calls.length;
    input.value = 'xy';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect((await waitForChange(onchange, beforeInvalid)).data.value).toBe('xy');
    await expect.poll(() => input.getAttribute('aria-invalid')).toBe('true');
    expectValidationError(view.container);
    expect(input.value).toBe('xy');
  });

  it('renders validation error for invalid value', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema,
      required: true,
    });

    expectValidationError(view.container);
  });
  it.each(['en', 'bg'] as const)(
    'localizes native clearing, restores focus and guards readonly in %s',
    async (locale) => {
      const { view, onchange } = await mountControl({
        renderers,
        propertySchema: propertySchema,
        value: 'custom text',
        options: { clearable: true },
        i18n: { locale },
      });
      const clear = view.getByRole('button', {
        name: messages[locale]['control.clearValue'],
        exact: true,
      });
      const before = onchange.mock.calls.length;
      await clear.click();
      expect((await waitForChange(onchange, before)).data.value).toBeUndefined();
      expect(document.activeElement).toBe(view.container.querySelector('input'));
      await view.rerender({ data: { value: 'retained' }, readonly: true });
      expect(view.container.querySelector('button')).toBeNull();
      expect(view.container.querySelector('input')?.disabled).toBe(true);
      expect(view.container.querySelector('input')?.value).toBe('retained');
    },
  );
});
