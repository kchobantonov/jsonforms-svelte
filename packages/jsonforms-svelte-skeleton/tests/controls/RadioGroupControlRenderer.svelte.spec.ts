import { clearAllIds } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import { entry as radioGroupControlRendererEntry } from '../../src/lib/controls/RadioGroupControlRenderer.entry';
import { expectValidationError, mountControl, waitForChange } from '../testUtils';

describe('RadioGroupControlRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(async () => {
    await cleanup();
  });

  const renderers = [radioGroupControlRendererEntry];

  it('renders radio group when no data is provided', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { type: 'string', enum: ['A', 'B', 'C'], title: 'Radio Choice' },
      options: { format: 'radio' },
    });

    const radios = Array.from(
      view.container.querySelectorAll<HTMLInputElement>('input[type="radio"]'),
    );
    expect(radios).toHaveLength(3);
    expect(radios.every((radio) => !radio.checked)).toBe(true);
    expect((view.container.textContent ?? '').includes('Radio Choice')).toBe(true);
  });

  it('updates core data on radio selection', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: { type: 'string', enum: ['A', 'B', 'C'] },
      value: 'A',
      options: { format: 'radio' },
    });

    const radios = Array.from(
      view.container.querySelectorAll<HTMLInputElement>('input[type="radio"]'),
    );
    expect(radios[0].checked).toBe(true);

    const before = onchange.mock.calls.length;
    radios[1].click();
    const changeEvent = await waitForChange(onchange, before);

    expect(changeEvent.data.value).toBe('B');
  });

  it('renders validation error when required data is missing', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { type: 'string', enum: ['A', 'B', 'C'] },
      options: { format: 'radio' },
      required: true,
    });

    expectValidationError(view.container);
  });
});
