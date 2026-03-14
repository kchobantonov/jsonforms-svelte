import { clearAllIds, type JsonSchema } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { entry as oneOfRadioGroupControlRendererEntry } from '../../src/lib/controls/OneOfRadioGroupControlRenderer.entry';
import { expectValidationError, mountControl, waitForChange } from '../testUtils';

describe('OneOfRadioGroupControlRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(() => {
    cleanup();
  });

  const renderers = [oneOfRadioGroupControlRendererEntry];
  const propertySchema: JsonSchema = {
    title: 'One Of Choice',
    type: 'string',
    oneOf: [
      { const: 'X', title: 'X' },
      { const: 'Y', title: 'Y' },
    ],
  };

  it('renders radio group when no data is provided', () => {
    const { view } = mountControl({
      renderers,
      propertySchema,
      options: { format: 'radio' },
    });

    const radios = Array.from(
      view.container.querySelectorAll<HTMLInputElement>('input[type="radio"]'),
    );
    expect(radios).toHaveLength(2);
    expect(radios.every((radio) => !radio.checked)).toBe(true);
    expect((view.container.textContent ?? '').includes('One Of Choice')).toBe(true);
  });

  it('updates core data on radio selection', async () => {
    const { view, onchange } = mountControl({
      renderers,
      propertySchema,
      value: 'X',
      options: { format: 'radio' },
    });

    const radios = Array.from(
      view.container.querySelectorAll<HTMLInputElement>('input[type="radio"]'),
    );
    expect(radios[0].checked).toBe(true);

    const before = onchange.mock.calls.length;
    radios[1].click();
    const changeEvent = await waitForChange(onchange, before);

    expect(changeEvent.data.value).toBe('Y');
  });

  it('renders validation error when required data is missing', () => {
    const { view } = mountControl({
      renderers,
      propertySchema,
      options: { format: 'radio' },
      required: true,
    });

    expectValidationError(view.container);
  });
});
