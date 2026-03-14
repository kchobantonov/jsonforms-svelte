import { clearAllIds, type JsonSchema } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { entry as mixedRendererEntry } from '../../src/lib/complex/MixedRenderer.entry';
import { entry as numberControlRendererEntry } from '../../src/lib/controls/NumberControlRenderer.entry';
import { entry as stringControlRendererEntry } from '../../src/lib/controls/StringControlRenderer.entry';
import { mountControl, waitForChange } from '../testUtils';

describe('MixedRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(() => {
    cleanup();
  });

  const renderers = [mixedRendererEntry, stringControlRendererEntry, numberControlRendererEntry];

  const propertySchema: JsonSchema = {
    title: 'Mixed Value',
    type: ['string', 'number'],
  };

  it('renders type selector and active primitive control', () => {
    const { view } = mountControl({
      renderers,
      propertySchema,
      value: 'Ada',
    });

    const select = view.container.querySelector<HTMLSelectElement>('select');
    expect(select).toBeTruthy();

    const textInput = view.container.querySelector<HTMLInputElement>('input[type="text"]');
    expect(textInput).toBeTruthy();
    expect(textInput?.value).toBe('Ada');
  });

  it('updates core data when switching mixed type', async () => {
    const { view, onchange } = mountControl({
      renderers,
      propertySchema,
      value: 'Ada',
    });

    const select = view.container.querySelector<HTMLSelectElement>('select');
    expect(select).toBeTruthy();

    const numberOption = Array.from(select!.options).find((option) =>
      option.textContent?.toLowerCase().includes('number'),
    );
    const fallbackOption = Array.from(select!.options).find(
      (option) => option.value !== '' && option.value !== select!.value,
    );

    const nextOption = numberOption ?? fallbackOption;
    expect(nextOption).toBeTruthy();

    const before = onchange.mock.calls.length;
    select!.value = nextOption!.value;
    select!.dispatchEvent(new Event('change', { bubbles: true }));
    const changeEvent = await waitForChange(onchange, before);

    if (numberOption) {
      expect(typeof changeEvent.data.value).toBe('number');
    } else {
      expect(changeEvent.data.value).not.toBe('Ada');
    }
  });
});
