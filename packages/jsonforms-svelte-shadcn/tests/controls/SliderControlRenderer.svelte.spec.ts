import { page } from 'vite-plus/test/browser';
import { tick } from 'svelte';
import { clearAllIds, type JsonSchema } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import { entry as sliderControlRendererEntry } from '../../src/lib/controls/SliderControlRenderer.entry';
import { getBySelector, mountControl } from '../testUtils';

describe('SliderControlRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(async () => {
    await cleanup();
  });

  const renderers = [sliderControlRendererEntry];
  const propertySchema: JsonSchema = {
    title: 'Slider Value',
    type: 'number',
    minimum: 0,
    maximum: 10,
    multipleOf: 1,
    default: 4,
  };

  it('associates slider help with its focusable control and preserves value text', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { ...propertySchema, description: 'Slider help' },
      options: { slider: true, shadcn: { Slider: { 'aria-describedby': 'author-help' } } },
    });
    const control = getBySelector<HTMLElement>(view.container, '[role="slider"]');
    const state = view.container.querySelector<HTMLElement>('[id$="-slider-state"]');
    expect(control.getAttribute('aria-describedby')?.split(' ')).toContain(state?.id);
    control.focus();
    await tick();
    const helper = view.container.querySelector<HTMLElement>('[id$="-help"]');
    expect(helper?.textContent).toContain('Slider help');
    expect(control.getAttribute('aria-describedby')?.split(' ')).toContain(helper?.id);
    expect(control.getAttribute('aria-describedby')?.split(' ')).toContain('author-help');
  });

  it('renders slider hidden input with schema default when no data is provided', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema,
      options: { slider: true },
    });

    const slider = getBySelector<HTMLElement>(view.container, '[role="slider"]');
    expect(slider.getAttribute('aria-valuenow')).toBe('4');
  });

  it('reflects the provided value in a thumb tooltip shown on hover', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema,
      value: 3,
      options: { slider: true },
    });

    const slider = getBySelector<HTMLElement>(view.container, '[role="slider"]');
    expect(slider.getAttribute('aria-valuenow')).toBe('3');
    const valueTooltip = getBySelector<HTMLElement>(
      view.container,
      '[data-slot="slider-value-tooltip"]',
    );
    expect(valueTooltip.textContent?.trim()).toBe('3');
    expect(getComputedStyle(valueTooltip).visibility).toBe('hidden');

    await page.elementLocator(slider).hover();
    await expect.poll(() => getComputedStyle(valueTooltip).visibility).toBe('visible');

    slider.focus();
    slider.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await vi.waitFor(() => {
      expect(slider.getAttribute('aria-valuenow')).toBe('4');
      expect(valueTooltip.textContent?.trim()).toBe('4');
    });

    await page.elementLocator(view.container.querySelector('label')!).hover();
    await expect.poll(() => getComputedStyle(valueTooltip).visibility).toBe('visible');
    slider.blur();
    await expect.poll(() => getComputedStyle(valueTooltip).visibility).toBe('hidden');
  });

  it('clamps an invalid value to the configured minimum', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { ...propertySchema, minimum: 5 },
      value: 2,
      options: { slider: true },
      required: true,
    });

    const slider = getBySelector<HTMLElement>(view.container, '[role="slider"]');
    expect(slider.getAttribute('aria-valuenow')).toBe('5');
  });
});
