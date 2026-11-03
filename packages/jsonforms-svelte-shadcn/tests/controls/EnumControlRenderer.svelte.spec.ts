import { tick } from 'svelte';
import { clearAllIds } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import { entry as enumControlRendererEntry } from '../../src/lib/controls/EnumControlRenderer.entry';
import {
  expectLabelVisible,
  expectValidationError,
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
  getComboboxTrigger(container).dispatchEvent(
    new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }),
  );

  let option: HTMLElement | undefined;
  await vi.waitFor(() => {
    option = Array.from(document.querySelectorAll<HTMLElement>('[role="option"]')).find(
      (candidate) => (candidate.textContent ?? '').trim().toLowerCase() === label.toLowerCase(),
    );
    expect(option).toBeTruthy();
  });

  option!.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'mouse' }));
};

describe('EnumControlRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(async () => {
    await cleanup();
  });

  const renderers = [enumControlRendererEntry];

  it.each([false, true])('associates visible help for autocomplete=%s', async (autocomplete) => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { type: 'string', enum: ['A', 'B'], description: 'Choice help' },
      options: {
        autocomplete,
        shadcn: { 'Select.Trigger': { 'aria-describedby': 'author-help' } },
      },
    });
    const input = view.container.querySelector<HTMLElement>('[id$="-input"]');
    expect(input).toBeTruthy();
    input?.focus();
    await tick();
    const helper = view.container.querySelector<HTMLElement>('[id$="-help"]');
    expect(helper?.textContent).toContain('Choice help');
    expect(input?.getAttribute('aria-describedby')?.split(' ')).toContain('author-help');
    expect(input?.getAttribute('aria-describedby')?.split(' ')).toContain(helper?.id);
  });

  it.each([false, true])(
    'keeps an imported value visible for autocomplete=%s',
    async (autocomplete) => {
      const { view } = await mountControl({
        renderers,
        propertySchema: { type: 'string', enum: ['A', 'B'] },
        value: 'outside',
        options: { autocomplete },
      });
      const status = view.container.querySelector<HTMLElement>('[id$="-invalid-value"]');
      expect(status?.textContent).toContain('"outside"');
      expect(status?.textContent).toContain('Current value outside the choices');
      const input = view.container.querySelector<HTMLElement>('[id$="-input"]');
      expect(input?.getAttribute('aria-describedby')?.split(' ')).toContain(status?.id);
      expect(view.container.querySelector('[aria-invalid="true"]')).toBeTruthy();
    },
  );

  it('renders select when no data is provided', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { type: 'string', enum: ['A', 'B', 'C'], title: 'Choice' },
    });

    const trigger = getComboboxTrigger(view.container);
    expect(trigger.textContent).toContain('Select an option');
    expectLabelVisible(view.container, 'Choice');
  });

  it('updates core data on selection change', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: { type: 'string', enum: ['A', 'B', 'C'] },
      value: 'A',
    });

    const trigger = getComboboxTrigger(view.container);
    expect(trigger.textContent).toContain('A');
    const before = onchange.mock.calls.length;
    await chooseComboboxOption(view.container, 'B');
    const changeEvent = await waitForChange(onchange, before);

    expect(changeEvent.data.value).toBe('B');
  });

  it('renders validation error when required data is missing', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { type: 'string', enum: ['A', 'B', 'C'] },
      required: true,
    });

    expectValidationError(view.container);
  });
});
