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

    const input = getBySelector<HTMLInputElement>(view.container, 'input[id$="-input"]');
    expect(input.type).toBe('text');
    expect(input.value).toBe('4');
    expect(view.container.querySelector('[role="slider"]')).toBeTruthy();
  });

  it('reflects provided value in the slider hidden input', () => {
    const { view } = mountControl({
      renderers,
      propertySchema,
      value: 3,
      options: { slider: true },
    });

    const input = getBySelector<HTMLInputElement>(view.container, 'input[id$="-input"]');
    expect(input.value).toBe('3');
    const slider = getBySelector<HTMLElement>(view.container, '[role="slider"]');
    expect(slider.getAttribute('aria-valuenow')).toBe('3');
  });

  it('renders validation error for invalid value', () => {
    const { view } = mountControl({
      renderers,
      propertySchema: { ...propertySchema, minimum: 5 },
      value: 2,
      options: { slider: true },
      required: true,
    });

    const validationMessage = getBySelector<HTMLElement>(view.container, '[role="alert"]');
    expect((validationMessage.textContent ?? '').trim().length).toBeGreaterThan(0);
  });
});
