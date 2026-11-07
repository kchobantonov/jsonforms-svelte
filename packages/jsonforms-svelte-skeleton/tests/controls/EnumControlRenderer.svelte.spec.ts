import { tick } from 'svelte';
import '../test.css';
import { clearAllIds } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
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

  afterEach(async () => {
    await cleanup();
  });

  const renderers = [enumControlRendererEntry];

  it.each([false, true])('associates visible help for nativeSelect=%s', async (nativeSelect) => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { type: 'string', enum: ['A', 'B'], description: 'Choice help' },
      options: {
        nativeSelect,
        skeleton: {
          'Combobox.Input': { 'aria-describedby': 'author-help' },
          select: { 'aria-describedby': 'author-help' },
        },
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

    const input = getBySelector<HTMLInputElement>(view.container, 'input[id$="-input"]');
    expect(input.value).toBe('');
    expectLabelVisible(view.container, 'Choice');
  });

  it('updates core data on selection change', async () => {
    const { view, onchange } = await mountControl({
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

  it('renders validation error when required data is missing', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { type: 'string', enum: ['A', 'B', 'C'] },
      required: true,
    });

    expectValidationError(view.container);
  });

  it('keeps a long finite choice list inside a scrolling popup', async () => {
    const choices = Array.from({ length: 100 }, (_, index) => `Option ${index}`);
    const { view } = await mountControl({
      renderers,
      propertySchema: { type: 'string', enum: choices },
    });
    getComboboxTrigger(view.container).click();
    await expect.poll(() => document.querySelectorAll('[role="option"]').length).toBe(100);
    const popup = document.querySelector<HTMLElement>(
      '[data-scope="combobox"][data-part="content"]',
    )!;
    expect(popup.clientHeight).toBeLessThanOrEqual(320);
    expect(popup.scrollHeight).toBeGreaterThan(popup.clientHeight);
    const last = Array.from(document.querySelectorAll<HTMLElement>('[role="option"]')).at(-1)!;
    last.scrollIntoView({ block: 'end' });
    await expect.poll(() => popup.scrollTop).toBeGreaterThan(0);
    expect(last.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      popup.getBoundingClientRect().bottom,
    );
  });

  it('keeps the long choice list inside a short viewport', async () => {
    await page.viewport(900, 360);
    try {
      const choices = Array.from({ length: 100 }, (_, index) => `Option ${index}`);
      const { view } = await mountControl({
        renderers,
        propertySchema: { type: 'string', enum: choices },
      });
      view.container.style.marginTop = '170px';
      getComboboxTrigger(view.container).click();
      const popup = document.querySelector<HTMLElement>(
        '[data-scope="combobox"][data-part="content"]',
      )!;
      await expect.poll(() => popup.getBoundingClientRect().height > 0).toBe(true);
      await expect
        .poll(() => {
          const { top, bottom } = popup.getBoundingClientRect();
          return top >= 0 && bottom <= window.innerHeight;
        })
        .toBe(true);
      expect(popup.scrollHeight).toBeGreaterThan(popup.clientHeight);
    } finally {
      await page.viewport(1280, 720);
    }
  });
});
