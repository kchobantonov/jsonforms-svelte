import { clearAllIds, type JsonSchema } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { entry as anyOfStringOrEnumControlRendererEntry } from '../../src/lib/controls/AnyOfStringOrEnumControlRenderer.entry';
import {
  expectLabelVisible,
  expectValidationError,
  getBySelector,
  mountControl,
  waitForChange,
} from '../testUtils';

describe('AnyOfStringOrEnumControlRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(() => {
    cleanup();
  });

  const renderers = [anyOfStringOrEnumControlRendererEntry];
  const propertySchema: JsonSchema = {
    title: 'Any Value',
    anyOf: [{ enum: ['A', 'B'] }, { type: 'string', minLength: 3 }],
  };

  it('renders text input when no data is provided', () => {
    const { view } = mountControl({
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
    const { view, onchange } = mountControl({
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

  it('renders validation error for invalid value', () => {
    const { view } = mountControl({
      renderers,
      propertySchema,
      required: true,
    });

    expectValidationError(view.container);
  });
});
