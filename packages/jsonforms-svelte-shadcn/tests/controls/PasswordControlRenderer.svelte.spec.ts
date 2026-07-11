import { clearAllIds } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { entry as passwordControlRendererEntry } from '../../src/lib/controls/PasswordControlRenderer.entry';
import {
  expectLabelVisible,
  expectValidationError,
  getBySelector,
  mountControl,
  waitForChange,
} from '../testUtils';

describe('PasswordControlRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(() => {
    cleanup();
  });

  const renderers = [passwordControlRendererEntry];

  it('renders password input when no data is provided', () => {
    const { view } = mountControl({
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
    const { view, onchange } = mountControl({
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

  it('renders validation error for invalid value', () => {
    const { view } = mountControl({
      renderers,
      propertySchema: { type: 'string', format: 'password', minLength: 8 },
      value: 'short',
      required: true,
    });

    expectValidationError(view.container);
  });
});
