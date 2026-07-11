import { clearAllIds, type JsonSchema } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { entry as objectRendererEntry } from '../../src/lib/complex/ObjectRenderer.entry';
import { entry as stringControlRendererEntry } from '../../src/lib/controls/StringControlRenderer.entry';
import { entry as groupRendererEntry } from '../../src/lib/layouts/GroupRenderer.entry';
import { entry as layoutRendererEntry } from '../../src/lib/layouts/LayoutRenderer.entry';
import { expectValidationError, getBySelector, mountControl, waitForChange } from '../testUtils';

describe('ObjectRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  const renderers = [
    objectRendererEntry,
    groupRendererEntry,
    layoutRendererEntry,
    stringControlRendererEntry,
  ];

  const propertySchema: JsonSchema = {
    type: 'object',
    title: 'Profile',
    properties: {
      name: {
        type: 'string',
        title: 'Name',
        minLength: 3,
      },
    },
    required: ['name'],
  };

  it('renders nested object control when no data is provided', () => {
    const { view } = mountControl({ renderers, propertySchema });

    const input = getBySelector<HTMLInputElement>(view.container, 'input[type="text"]');
    expect(input.value).toBe('');
  });

  it('updates core data from nested input change', async () => {
    const { view, onchange } = mountControl({
      renderers,
      propertySchema,
      value: { name: 'Ada' },
    });

    const input = getBySelector<HTMLInputElement>(view.container, 'input[type="text"]');
    expect(input.value).toBe('Ada');

    const before = onchange.mock.calls.length;
    input.value = 'Grace';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const changeEvent = await waitForChange(onchange, before);

    const value = changeEvent.data.value as { name: string };
    expect(value.name).toBe('Grace');
  });

  it('renders validation error for invalid nested data', () => {
    const { view } = mountControl({
      renderers,
      propertySchema,
      value: { name: 'Al' },
    });

    expectValidationError(view.container);
  });

  it('renames a dynamic property while preserving its value', async () => {
    const { view, onchange } = mountControl({
      renderers,
      propertySchema: {
        type: 'object',
        additionalProperties: { type: 'string' },
      },
      value: { nickname: 'Ada' },
    });

    const renameButton = getBySelector<HTMLButtonElement>(
      view.container,
      'button[aria-label="Rename button"]',
    );
    renameButton.click();

    await vi.waitFor(() => {
      expect(document.querySelector('#shadcn-rename-property')).toBeTruthy();
    });
    const renameInput = document.querySelector<HTMLInputElement>('#shadcn-rename-property')!;
    renameInput.value = 'displayName';
    renameInput.dispatchEvent(new Event('input', { bubbles: true }));

    const before = onchange.mock.calls.length;
    document.querySelector<HTMLButtonElement>('form button[type="submit"]')!.click();
    const changeEvent = await waitForChange(onchange, before);

    expect(changeEvent.data.value).toEqual({ displayName: 'Ada' });
  });
});
