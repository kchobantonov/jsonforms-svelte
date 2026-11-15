import { tick } from 'svelte';
import { clearAllIds } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import { entry as integerControlRendererEntry } from '../../src/lib/controls/IntegerControlRenderer.entry';
import {
  expectLabelVisible,
  expectValidationError,
  getBySelector,
  mountControl,
  waitForChange,
} from '../testUtils';

describe('IntegerControlRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(async () => {
    await cleanup();
  });

  const renderers = [integerControlRendererEntry];

  it('links visible help to the numeric input without replacing authored or incompatible hints', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { type: 'integer', description: 'Numeric help text' },
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
      propertySchema: { type: 'integer', description: 'Hidden wrapper help' },
      value: 'legacy',
      options: { hideControlWrapper: true, showUnfocusedDescription: true },
    });
    const input = getBySelector<HTMLInputElement>(view.container, 'input[id$="-input"]');
    const hint = view.container.querySelector<HTMLElement>('[id$="-incompatible-value"]');
    expect(hint).toBeTruthy();
    expect(input.getAttribute('aria-describedby')?.split(' ')).toContain(hint?.id);
    expect(input.getAttribute('aria-describedby')).not.toContain('-help');
  });

  it('renders integer input when no data is provided', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { type: 'integer', title: 'Count' },
      options: { placeholder: 'Integer value' },
    });

    const input = getBySelector<HTMLInputElement>(view.container, 'input[id$="-input"]');
    expect(input.type).toBe('number');
    expect(input.getAttribute('step')).toBe('1');
    expect(input.value).toBe('');
    expect(input.getAttribute('placeholder')).toBe('Integer value');
    expectLabelVisible(view.container, 'Count');
  });

  it('updates core data with a complete integer value', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: { type: 'integer' },
      value: 2,
    });

    const input = getBySelector<HTMLInputElement>(view.container, 'input[id$="-input"]');
    expect(input.value).toBe('2');
    const before = onchange.mock.calls.length;
    input.value = '7';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const changeEvent = await waitForChange(onchange, before);

    expect(changeEvent.data.value).toBe(7);
  });

  it('renders validation error for invalid value', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { type: 'integer', minimum: 5 },
      value: 2,
      required: true,
    });

    expectValidationError(view.container);
  });
});
