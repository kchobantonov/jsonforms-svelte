import { tick } from 'svelte';
import { clearAllIds } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import { entry as booleanControlRendererEntry } from '../../src/lib/controls/BooleanControlRenderer.entry';
import {
  expectLabelVisible,
  expectValidationError,
  getBySelector,
  mountControl,
  waitForChange,
} from '../testUtils';

describe('BooleanControlRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(async () => {
    await cleanup();
  });

  const renderers = [booleanControlRendererEntry];

  it('associates visible help without losing the missing-state hint or authored description', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { type: 'boolean', description: 'Boolean help' },
      options: { flowbite: { Checkbox: { 'aria-describedby': 'author-help' } } },
    });
    const checkbox = view.container.querySelector<HTMLElement>(
      '[role="checkbox"], input[type="checkbox"]',
    );
    expect(checkbox).toBeTruthy();
    const state = view.container.querySelector<HTMLElement>('[data-boolean-state]');
    expect(checkbox?.getAttribute('aria-describedby')?.split(' ')).toContain('author-help');
    expect(checkbox?.getAttribute('aria-describedby')?.split(' ')).toContain(state?.id);
    checkbox?.focus();
    await tick();
    const helper = view.container.querySelector<HTMLElement>('[id$="-help"]');
    expect(helper?.textContent).toContain('Boolean help');
    expect(checkbox?.getAttribute('aria-describedby')?.split(' ')).toContain(helper?.id);
  });

  it('renders checkbox when no data is provided', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { type: 'boolean', title: 'Enabled' },
    });

    const input = getBySelector<HTMLInputElement>(view.container, 'input[type="checkbox"]');
    expect(input.checked).toBe(false);
    expectLabelVisible(view.container, 'Enabled');
  });

  it('updates core data on checkbox toggle', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: { type: 'boolean' },
      value: true,
    });

    const input = getBySelector<HTMLInputElement>(view.container, 'input[type="checkbox"]');
    expect(input.checked).toBe(true);
    const before = onchange.mock.calls.length;
    input.checked = false;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const changeEvent = await waitForChange(onchange, before);

    expect(changeEvent.data.value).toBe(false);
  });

  it('renders validation error when required data is missing', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { type: 'boolean' },
      required: true,
    });

    expectValidationError(view.container);
  });
});
