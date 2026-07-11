import { clearAllIds } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { entry as booleanToggleControlRendererEntry } from '../../src/lib/controls/BooleanToggleControlRenderer.entry';
import {
  expectLabelVisible,
  expectValidationError,
  mountControl,
  waitForChange,
} from '../testUtils';
import '../test.css';

describe('BooleanToggleControlRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(() => {
    cleanup();
  });

  const renderers = [booleanToggleControlRendererEntry];

  it('renders toggle when no data is provided', () => {
    const { view } = mountControl({
      renderers,
      propertySchema: { type: 'boolean', title: 'Enabled' },
      options: { toggle: true },
    });

    const toggle = view.container.querySelector<HTMLButtonElement>('[role="switch"]');
    const thumb = toggle?.querySelector<HTMLElement>('[data-slot="switch-thumb"]');
    expect(toggle).toBeTruthy();
    expect(thumb).toBeTruthy();
    expect(toggle?.getAttribute('aria-checked')).toBe('false');
    expect(toggle?.dataset.state).toBe('unchecked');
    expect(getComputedStyle(toggle!).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(getComputedStyle(thumb!).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expectLabelVisible(view.container, 'Enabled');
  });

  it('updates core data on toggle change', async () => {
    const { view, onchange } = mountControl({
      renderers,
      propertySchema: { type: 'boolean' },
      value: false,
      options: { toggle: true },
    });

    const toggle = view.container.querySelector<HTMLButtonElement>('[role="switch"]');
    const thumb = toggle?.querySelector<HTMLElement>('[data-slot="switch-thumb"]');
    expect(toggle).toBeTruthy();
    expect(thumb).toBeTruthy();
    expect(toggle?.getAttribute('aria-checked')).toBe('false');
    const uncheckedTranslation = getComputedStyle(thumb!).translate;

    const before = onchange.mock.calls.length;
    toggle!.click();
    const changeEvent = await waitForChange(onchange, before);

    expect(changeEvent.data.value).toBe(true);
    expect(toggle?.getAttribute('aria-checked')).toBe('true');
    expect(toggle?.dataset.state).toBe('checked');
    await expect.poll(() => getComputedStyle(thumb!).translate).not.toBe(uncheckedTranslation);
  });

  it('renders validation error when required data is missing', () => {
    const { view } = mountControl({
      renderers,
      propertySchema: { type: 'boolean' },
      options: { toggle: true },
      required: true,
    });

    expectValidationError(view.container);
  });
});
