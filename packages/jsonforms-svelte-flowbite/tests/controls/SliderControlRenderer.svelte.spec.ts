import { clearAllIds, type JsonSchema } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { entry as sliderControlRendererEntry } from '../../src/lib/controls/SliderControlRenderer.entry';
import {
  expectLabelVisible,
  expectValidationError,
  getBySelector,
  mountControl,
  waitForChange,
} from '../testUtils';

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

  it('renders range input with schema default when no data is provided', () => {
    const { view } = mountControl({
      renderers,
      propertySchema,
      options: { slider: true },
    });

    const input = getBySelector<HTMLInputElement>(view.container, 'input[id$="-input"]');
    expect(input.type).toBe('range');
    expect(input.value).toBe('4');
    expectLabelVisible(view.container, 'Slider Value');
  });

  it('updates core data on slider move', async () => {
    const { view, onchange } = mountControl({
      renderers,
      propertySchema,
      value: 3,
      options: { slider: true },
    });

    const input = getBySelector<HTMLInputElement>(view.container, 'input[id$="-input"]');
    expect(input.value).toBe('3');
    const before = onchange.mock.calls.length;
    input.value = '7';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const changeEvent = await waitForChange(onchange, before);

    expect(changeEvent.data.value).toBe(7);
  });

  it('renders validation error for invalid value', () => {
    const { view } = mountControl({
      renderers,
      propertySchema: { ...propertySchema, minimum: 5 },
      value: 2,
      options: { slider: true },
      required: true,
    });

    expectValidationError(view.container);
  });
});
