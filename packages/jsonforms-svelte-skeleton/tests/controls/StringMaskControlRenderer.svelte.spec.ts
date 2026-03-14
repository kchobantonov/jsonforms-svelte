import { clearAllIds } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
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

  afterEach(() => {
    cleanup();
  });

  const renderers = [stringMaskControlRendererEntry];

  it('renders masked input when no data is provided', () => {
    const { view } = mountControl({
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
    const { view, onchange } = mountControl({
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
    const { view, onchange } = mountControl({
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

  it('renders validation error for invalid value', () => {
    const { view } = mountControl({
      renderers,
      propertySchema: { type: 'string', minLength: 7 },
      value: '12-3',
      options: { mask: '###-###', returnMaskedValue: true },
      required: true,
    });

    expectValidationError(view.container);
  });
});
