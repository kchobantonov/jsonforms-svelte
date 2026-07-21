import { clearAllIds, type JsonSchema } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { entry as sliderControlRendererEntry } from '../../src/lib/controls/SliderControlRenderer.entry';
import { getBySelector, mountControl } from '../testUtils';

describe('SliderControlRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(() => {
    cleanup();
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

  it('renders slider hidden input with schema default when no data is provided', () => {
    const { view } = mountControl({
      renderers,
      propertySchema,
      options: { slider: true },
    });

    const slider = getBySelector<HTMLElement>(view.container, '[role="slider"]');
    expect(slider.getAttribute('aria-valuenow')).toBe('4');
  });

  it('reflects the provided value in a thumb tooltip shown on hover', async () => {
    const { view } = mountControl({
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
    expect(valueTooltip.classList.contains('data-active:visible')).toBe(true);
    expect(valueTooltip.classList.contains('invisible')).toBe(true);

    slider.dispatchEvent(new PointerEvent('pointerenter'));
    await vi.waitFor(() => {
      expect(valueTooltip.classList.contains('visible')).toBe(true);
      expect(valueTooltip.classList.contains('invisible')).toBe(false);
    });

    slider.focus();
    slider.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await vi.waitFor(() => {
      expect(slider.getAttribute('aria-valuenow')).toBe('4');
      expect(valueTooltip.textContent?.trim()).toBe('4');
    });

    slider.dispatchEvent(new PointerEvent('pointerleave'));
    slider.blur();
    await vi.waitFor(() => {
      expect(valueTooltip.classList.contains('invisible')).toBe(true);
    });
  });

  it('clamps an invalid value to the configured minimum', () => {
    const { view } = mountControl({
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
