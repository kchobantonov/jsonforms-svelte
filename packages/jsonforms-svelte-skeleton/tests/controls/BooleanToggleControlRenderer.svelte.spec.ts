import { tick } from 'svelte';
import { clearAllIds } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import { entry as booleanToggleControlRendererEntry } from '../../src/lib/controls/BooleanToggleControlRenderer.entry';
import {
  expectLabelVisible,
  expectValidationError,
  mountControl,
  waitForChange,
} from '../testUtils';

describe('BooleanToggleControlRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(async () => {
    await cleanup();
  });

  const renderers = [booleanToggleControlRendererEntry];

  it('associates visible help with the switch while preserving its state hint', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { type: 'boolean', description: 'Switch help' },
      options: {
        toggle: true,
        skeleton: { 'Switch.HiddenInput': { 'aria-describedby': 'author-help' } },
      },
    });
    const control = view.container.querySelector<HTMLElement>('input[id$="-input"]');
    expect(control).toBeTruthy();
    const state = view.container.querySelector<HTMLElement>('[data-boolean-state]');
    expect(control?.getAttribute('aria-describedby')?.split(' ')).toContain('author-help');
    expect(control?.getAttribute('aria-describedby')?.split(' ')).toContain(state?.id);
    control?.focus();
    await tick();
    const helper = view.container.querySelector<HTMLElement>('[id$="-help"]');
    expect(helper?.textContent).toContain('Switch help');
    expect(control?.getAttribute('aria-describedby')?.split(' ')).toContain(helper?.id);
  });

  it('renders toggle when no data is provided', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { type: 'boolean', title: 'Enabled' },
      options: { toggle: true },
    });

    const input = view.container.querySelector<HTMLInputElement>('input[type="checkbox"]');
    expect(input).toBeTruthy();
    expect(input?.checked).toBe(false);
    expectLabelVisible(view.container, 'Enabled');
  });

  it('updates core data on toggle change', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: { type: 'boolean' },
      value: false,
      options: { toggle: true },
    });

    const input = view.container.querySelector<HTMLInputElement>('input[type="checkbox"]');
    expect(input).toBeTruthy();
    expect(input?.checked).toBe(false);

    const before = onchange.mock.calls.length;
    input!.click();
    const changeEvent = await waitForChange(onchange, before);

    expect(changeEvent.data.value).toBe(true);
  });

  it('renders validation error when required data is missing', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { type: 'boolean' },
      options: { toggle: true },
      required: true,
    });

    expectValidationError(view.container);
  });
});
