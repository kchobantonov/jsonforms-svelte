import { clearAllIds } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { entry as enumControlRendererEntry } from '../../src/lib/controls/EnumControlRenderer.entry';
import {
  expectLabelVisible,
  expectValidationError,
  getBySelector,
  mountControl,
  waitForChange,
} from '../testUtils';

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

describe('EnumControlRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(() => {
    cleanup();
  });

  const renderers = [enumControlRendererEntry];

  it('renders select when no data is provided', () => {
    const { view } = mountControl({
      renderers,
      propertySchema: { type: 'string', enum: ['A', 'B', 'C'], title: 'Choice' },
    });

    const input = getBySelector<HTMLInputElement>(view.container, 'input[id$="-input"]');
    expect(input.value).toBe('');
    expectLabelVisible(view.container, 'Choice');
  });

  it('updates core data on selection change', async () => {
    const { view, onchange } = mountControl({
      renderers,
      propertySchema: { type: 'string', enum: ['A', 'B', 'C'] },
      value: 'A',
    });

    const input = getBySelector<HTMLInputElement>(view.container, 'input[id$="-input"]');
    expect(input.value).toBe('A');
    const before = onchange.mock.calls.length;
    await chooseComboboxOption(view.container, 'B');
    const changeEvent = await waitForChange(onchange, before);

    expect(changeEvent.data.value).toBe('B');
  });

  it('renders validation error when required data is missing', () => {
    const { view } = mountControl({
      renderers,
      propertySchema: { type: 'string', enum: ['A', 'B', 'C'] },
      required: true,
    });

    expectValidationError(view.container);
  });
});
