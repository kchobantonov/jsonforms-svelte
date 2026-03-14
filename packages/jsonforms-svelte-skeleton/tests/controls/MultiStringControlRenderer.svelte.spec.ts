import { clearAllIds } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
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

  afterEach(() => {
    cleanup();
  });

  const renderers = [multiStringControlRendererEntry];

  it('renders textarea when no data is provided', () => {
    const { view } = mountControl({
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
    const { view, onchange } = mountControl({
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

  it('renders validation error for invalid value', () => {
    const { view } = mountControl({
      renderers,
      propertySchema: { type: 'string', minLength: 5 },
      value: 'abc',
      options: { multi: true },
      required: true,
    });

    expectValidationError(view.container);
  });
});
