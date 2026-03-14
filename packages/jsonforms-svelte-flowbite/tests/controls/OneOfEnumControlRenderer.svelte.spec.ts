import { clearAllIds, type JsonSchema } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { entry as oneOfEnumControlRendererEntry } from '../../src/lib/controls/OneOfEnumControlRenderer.entry';
import {
  expectLabelVisible,
  expectValidationError,
  getBySelector,
  mountControl,
  waitForChange,
} from '../testUtils';

describe('OneOfEnumControlRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(() => {
    cleanup();
  });

  const renderers = [oneOfEnumControlRendererEntry];
  const propertySchema: JsonSchema = {
    title: 'One Of Choice',
    type: 'string',
    oneOf: [
      { const: 'X', title: 'X' },
      { const: 'Y', title: 'Y' },
    ],
  };

  it('renders select when no data is provided', () => {
    const { view } = mountControl({ renderers, propertySchema });
    const select = getBySelector<HTMLSelectElement>(view.container, 'select[id$="-input"]');
    expect(select.options.length).toBeGreaterThan(0);
    expect(select.value).toBe('');
    expectLabelVisible(view.container, 'One Of Choice');
  });

  it('updates core data on selection change', async () => {
    const { view, onchange } = mountControl({
      renderers,
      propertySchema,
      value: 'X',
    });

    const select = getBySelector<HTMLSelectElement>(view.container, 'select[id$="-input"]');
    expect(select.value).toBe('X');
    const before = onchange.mock.calls.length;
    select.value = 'Y';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    const changeEvent = await waitForChange(onchange, before);

    expect(changeEvent.data.value).toBe('Y');
  });

  it('renders validation error when required data is missing', () => {
    const { view } = mountControl({ renderers, propertySchema, required: true });
    expectValidationError(view.container);
  });
});
