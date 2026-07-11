import { clearAllIds, type JsonSchema } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
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

  it('reflects provided value in the slider hidden input', () => {
    const { view } = mountControl({
      renderers,
      propertySchema,
      value: 3,
      options: { slider: true },
    });

    const slider = getBySelector<HTMLElement>(view.container, '[role="slider"]');
    expect(slider.getAttribute('aria-valuenow')).toBe('3');
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
