import { clearAllIds, type JsonSchema } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { entry as mixedRendererEntry } from '../../src/lib/complex/MixedRenderer.entry';
import { entry as numberControlRendererEntry } from '../../src/lib/controls/NumberControlRenderer.entry';
import { entry as stringControlRendererEntry } from '../../src/lib/controls/StringControlRenderer.entry';
import { mountControl, waitForChange } from '../testUtils';

const getComboboxTrigger = (container: HTMLElement): HTMLButtonElement => {
  const byRole = container.querySelector<HTMLButtonElement>('button[aria-haspopup="listbox"]');
  if (byRole) return byRole;

  const byPart = container.querySelector<HTMLButtonElement>('button[data-part="trigger"]');
  if (byPart) return byPart;

  const fallback = Array.from(container.querySelectorAll<HTMLButtonElement>('button')).find(
    (button) => (button.getAttribute('aria-label') ?? '').toLowerCase() !== 'clear value',
  );
  expect(fallback).toBeTruthy();
  return fallback as HTMLButtonElement;
};

const chooseComboboxOption = async (container: HTMLElement, label: string) => {
  getComboboxTrigger(container).click();

  let option: HTMLElement | undefined;
  await vi.waitFor(() => {
    option = Array.from(document.querySelectorAll<HTMLElement>('[role="option"]')).find(
      (candidate) => (candidate.textContent ?? '').trim().toLowerCase() === label.toLowerCase(),
    );
    expect(option).toBeTruthy();
  });

  option!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
};

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

    const input = view.container.querySelector<HTMLInputElement>('input[id$="-input"]');
    expect(input).toBeTruthy();

    const textInput = Array.from(
      view.container.querySelectorAll<HTMLInputElement>('input[type="text"]'),
    ).find((candidate) => candidate.value === 'Ada');
    expect(textInput).toBeTruthy();
    expect(textInput?.value).toBe('Ada');
  });

  it('updates core data when switching mixed type', async () => {
    const { view, onchange } = mountControl({
      renderers,
      propertySchema,
      value: 'Ada',
    });

    const before = onchange.mock.calls.length;
    await chooseComboboxOption(view.container, 'Number');
    const changeEvent = await waitForChange(onchange, before);

    expect(typeof changeEvent.data.value).toBe('number');
  });
});
