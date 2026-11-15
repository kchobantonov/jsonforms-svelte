import '../test.css';
import { tick } from 'svelte';
import { page } from 'vite-plus/test/browser';
import { clearAllIds } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import { entry as numberControlRendererEntry } from '../../src/lib/controls/NumberControlRenderer.entry';
import {
  expectLabelVisible,
  expectValidationError,
  getBySelector,
  mountControl,
  waitForChange,
} from '../testUtils';

describe('NumberControlRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(async () => {
    await cleanup();
  });

  const renderers = [numberControlRendererEntry];

  it('reveals a populated numeric clear button on hover or focus', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { type: 'number' },
      value: 12,
    });
    view.container.style.padding = '40px';
    const input = getBySelector<HTMLInputElement>(view.container, 'input[id$="-input"]');
    const clear = getBySelector<HTMLButtonElement>(
      view.container,
      'button[aria-label="Clear value"]',
    );
    await page.elementLocator(view.container).hover({ position: { x: 1, y: 1 } });
    expect(getComputedStyle(clear).visibility).toBe('hidden');
    await page.elementLocator(input).hover();
    expect(getComputedStyle(clear).visibility).toBe('visible');
    await page.elementLocator(view.container).hover({ position: { x: 1, y: 1 } });
    input.focus();
    expect(getComputedStyle(clear).visibility).toBe('visible');
  });

  it('links visible help to the numeric input without replacing authored or incompatible hints', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { type: 'number', description: 'Numeric help text' },
      options: { flowbite: { Input: { 'aria-describedby': 'author-help' } } },
    });
    const input = getBySelector<HTMLInputElement>(view.container, 'input[id$="-input"]');
    expect(input.getAttribute('aria-describedby')).toBe('author-help');
    input.focus();
    await tick();
    const helper = view.container.querySelector<HTMLElement>('[id$="-help"]');
    expect(helper?.textContent).toContain('Numeric help text');
    expect(input.getAttribute('aria-describedby')?.split(' ')).toContain(helper?.id);
    input.blur();
    await tick();
    expect(input.getAttribute('aria-describedby')).toBe('author-help');
  });

  it('keeps an incompatible-value hint but not an absent wrapper helper', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { type: 'number', description: 'Hidden wrapper help' },
      value: 'legacy',
      options: { hideControlWrapper: true, showUnfocusedDescription: true },
    });
    const input = getBySelector<HTMLInputElement>(view.container, 'input[id$="-input"]');
    const hint = view.container.querySelector<HTMLElement>('[id$="-incompatible-value"]');
    expect(hint).toBeTruthy();
    expect(input.getAttribute('aria-describedby')?.split(' ')).toContain(hint?.id);
    expect(input.getAttribute('aria-describedby')).not.toContain('-help');
  });

  it('renders number input when no data is provided', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { type: 'number', title: 'Amount' },
      options: { placeholder: 'Amount value' },
    });

    const input = getBySelector<HTMLInputElement>(view.container, 'input[id$="-input"]');
    expect(input.type).toBe('number');
    expect(input.value).toBe('');
    expect(input.getAttribute('placeholder')).toBe('Amount value');
    expectLabelVisible(view.container, 'Amount');
  });

  it('updates core data on input', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: { type: 'number' },
      value: 1.5,
    });

    const input = getBySelector<HTMLInputElement>(view.container, 'input[id$="-input"]');
    expect(input.value).toBe('1.5');
    const before = onchange.mock.calls.length;
    input.value = '2.75';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const changeEvent = await waitForChange(onchange, before);

    expect(changeEvent.data.value).toBe(2.75);
  });

  it('renders validation error for invalid value', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { type: 'number', minimum: 5 },
      value: 1,
      required: true,
    });

    expectValidationError(view.container);
  });
});
