import { clearAllIds, type JsonSchema } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { nullControlRendererEntry } from '../../src/lib/controls';
import { expectLabelVisible, mountControl, waitForChange } from '../testUtils';

describe('NullControlRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(() => {
    cleanup();
  });

  const renderers = [nullControlRendererEntry];
  const propertySchema: JsonSchema = {
    type: 'null',
    title: 'Nullable marker',
  };

  it('renders an indeterminate checkbox when the property is unset', () => {
    const { view } = mountControl({
      renderers,
      propertySchema,
    });

    const checkbox = view.container.querySelector<HTMLButtonElement>('[role="checkbox"]');
    expect(checkbox).toBeTruthy();
    expect(checkbox?.getAttribute('aria-checked')).toBe('mixed');
    expectLabelVisible(view.container, 'Nullable marker');
  });

  it('marks the checkbox as checked when the value is null', () => {
    const { view } = mountControl({
      renderers,
      propertySchema,
      value: null,
    });

    const checkbox = view.container.querySelector<HTMLButtonElement>('[role="checkbox"]');
    expect(checkbox).toBeTruthy();
    expect(checkbox?.getAttribute('aria-checked')).toBe('true');
  });

  it('updates core data to null when checked and removes it when unchecked', async () => {
    const { view, onchange } = mountControl({
      renderers,
      propertySchema,
    });

    const checkbox = view.container.querySelector<HTMLButtonElement>('[role="checkbox"]');
    expect(checkbox).toBeTruthy();

    let before = onchange.mock.calls.length;
    checkbox!.click();
    let changeEvent = await waitForChange(onchange, before);
    expect(changeEvent.data.value).toBeNull();

    before = onchange.mock.calls.length;
    checkbox!.click();
    changeEvent = await waitForChange(onchange, before);
    expect(changeEvent.data.value).toBeUndefined();
  });
});
