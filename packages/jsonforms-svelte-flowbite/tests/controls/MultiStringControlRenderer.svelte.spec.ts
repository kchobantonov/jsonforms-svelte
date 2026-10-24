import messages from '../../../jsonforms-svelte/src/lib/locales/messages.json';
import { clearAllIds } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import { entry as multiStringControlRendererEntry } from '../../src/lib/controls/MultiStringControlRenderer.entry';
import {
  expectLabelVisible,
  expectValidationError,
  getBySelector,
  mountControl,
  waitForChange,
} from '../testUtils';

describe('MultiStringControlRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(async () => {
    await cleanup();
  });

  const renderers = [multiStringControlRendererEntry];

  it('renders textarea when no data is provided', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { type: 'string', title: 'Description' },
      options: { multi: true, placeholder: 'Enter description' },
    });

    const textarea = getBySelector<HTMLTextAreaElement>(view.container, 'textarea[id$="-input"]');
    expect(textarea.value).toBe('');
    expect(textarea.getAttribute('placeholder')).toBe('Enter description');
    expectLabelVisible(view.container, 'Description');
  });

  it('updates core data on text input', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: { type: 'string' },
      value: 'line one',
      options: { multi: true },
    });

    const textarea = getBySelector<HTMLTextAreaElement>(view.container, 'textarea[id$="-input"]');
    expect(textarea.value).toBe('line one');
    const before = onchange.mock.calls.length;
    textarea.value = 'line two';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    const changeEvent = await waitForChange(onchange, before);

    expect(changeEvent.data.value).toBe('line two');
  });

  it('renders validation error for invalid value', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { type: 'string', minLength: 5 },
      value: 'abc',
      options: { multi: true },
      required: true,
    });

    expectValidationError(view.container);
  });
  it.each(['en', 'bg'] as const)(
    'localizes native clearing, restores focus and guards readonly in %s',
    async (locale) => {
      const { view, onchange } = await mountControl({
        renderers,
        propertySchema: { type: 'string' },
        value: 'custom text',
        options: { multi: true, clearable: true },
        i18n: { locale },
      });
      const clear = view.getByRole('button', {
        name: messages[locale]['control.clearValue'],
        exact: true,
      });
      const before = onchange.mock.calls.length;
      await clear.click();
      expect((await waitForChange(onchange, before)).data.value).toBeUndefined();
      expect(document.activeElement).toBe(view.container.querySelector('textarea'));
      await view.rerender({ data: { value: 'retained' }, readonly: true });
      expect(view.container.querySelector('button')).toBeNull();
      expect(view.container.querySelector('textarea')?.disabled).toBe(true);
      expect(view.container.querySelector('textarea')?.value).toBe('retained');
    },
  );
});
