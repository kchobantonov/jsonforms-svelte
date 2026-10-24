import { clearAllIds, type JsonSchema } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { entry as enumArrayRendererEntry } from '../../src/lib/complex/EnumArrayRenderer.entry';
import { mountControl, waitForChange } from '../testUtils';

const choices = (container: HTMLElement) => {
  const roles = [...container.querySelectorAll<HTMLElement>('[role="checkbox"]')];
  return roles.length
    ? roles
    : [...container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')];
};
const isDisabled = (element: HTMLElement) =>
  (element as HTMLInputElement).disabled || element.getAttribute('aria-disabled') === 'true';

describe('EnumArrayRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(async () => {
    await cleanup();
  });

  const renderers = [enumArrayRendererEntry];
  const propertySchema = {
    type: 'array',
    title: 'Tags',
    uniqueItems: true,
    minItems: 2,
    items: {
      type: 'string',
      enum: ['A', 'B'],
    } as unknown as JsonSchema,
  } as JsonSchema;

  it('renders enum checkboxes and current selection', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema,
      value: ['A'],
    });

    const checkboxes = Array.from(
      view.container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
    );
    expect(checkboxes).toHaveLength(2);
    expect(checkboxes[0].checked).toBe(true);
    expect(checkboxes[1].checked).toBe(false);
  });

  it('updates core data when checkbox state changes', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema,
      value: ['A'],
    });

    const checkboxes = Array.from(
      view.container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
    );
    const before = onchange.mock.calls.length;

    checkboxes[1].click();
    const changeEvent = await waitForChange(onchange, before);

    const value = changeEvent.data.value as string[];
    expect(value).toContain('A');
    expect(value).toContain('B');
  });

  it('preserves selected values in rendered checkboxes', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema,
      value: ['A'],
    });

    const checkboxes = Array.from(
      view.container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
    );
    expect(checkboxes[0].checked).toBe(true);
    expect(checkboxes[1].checked).toBe(false);
  });
  it('prevents bound violations but lets an authored restrict false defer to validation', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: { ...propertySchema, minItems: 1, maxItems: 1 },
      value: ['A'],
    });
    expect(choices(view.container).map(isDisabled)).toEqual([true, true]);
    await view.rerender({
      uischema: { type: 'Control', scope: '#/properties/value', options: { restrict: false } },
    });
    await vi.waitFor(() => expect(choices(view.container).map(isDisabled)).toEqual([false, false]));
    const before = onchange.mock.calls.length;
    choices(view.container)[1].click();
    const event = await waitForChange(onchange, before);
    expect(event.data.value).toEqual(['A', 'B']);
    expect(event.errors.length).toBeGreaterThan(0);
  });
  it('shows invalid imported members and removes only one repeated occurrence at a time', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema,
      value: ['A', 'A', 'Imported'],
      options: { restrict: false },
    });
    expect(view.container.textContent).toContain('Imported');
    expect(choices(view.container)).toHaveLength(3);
    let before = onchange.mock.calls.length;
    choices(view.container)[0].click();
    let event = await waitForChange(onchange, before);
    expect(event.data.value).toEqual(['A', 'Imported']);
    await vi.waitFor(() => {
      const first = choices(view.container)[0];
      expect(
        first instanceof HTMLInputElement
          ? first.checked
          : first.getAttribute('aria-checked') === 'true',
      ).toBe(true);
    });
    before = onchange.mock.calls.length;
    choices(view.container)[2].click();
    event = await waitForChange(onchange, before);
    expect(event.data.value).toEqual(['A']);
    await vi.waitFor(() => expect(view.container.textContent).not.toContain('Imported'));
  });
});
