import { clearAllIds } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { entry as stringControlRendererEntry } from '../../src/lib/controls/StringControlRenderer.entry';
import {
  expectLabelVisible,
  expectValidationError,
  getBySelector,
  mountControl,
  waitForChange,
} from '../testUtils';

describe('StringControlRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(() => {
    cleanup();
  });

  const renderers = [stringControlRendererEntry];

  it('renders empty input when no data is provided', () => {
    const { view } = mountControl({
      renderers,
      propertySchema: { type: 'string', title: 'My String' },
      options: { placeholder: 'string placeholder' },
    });

    const input = getBySelector<HTMLInputElement>(view.container, 'input[type="text"]');
    expect(input.value).toBe('');
    expect(input.getAttribute('placeholder')).toBe('string placeholder');
    expectLabelVisible(view.container, 'My String');
  });

  it('updates core data on input', async () => {
    const { view, onchange } = mountControl({
      renderers,
      propertySchema: { type: 'string' },
      value: 'a',
    });

    const input = getBySelector<HTMLInputElement>(view.container, 'input[type="text"]');
    expect(input.value).toBe('a');
    const before = onchange.mock.calls.length;
    input.value = 'b';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const changeEvent = await waitForChange(onchange, before);

    expect(changeEvent.data.value).toBe('b');
  });

  it('renders validation error for invalid value', () => {
    const { view } = mountControl({
      renderers,
      propertySchema: { type: 'string', minLength: 3 },
      value: 'ab',
      required: true,
    });

    expectValidationError(view.container);
  });
});
