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

  it.each(['Custom name', 'Име по избор'])(
    'uses a bare detail layout labelled %s at the nested value',
    async (label) => {
      const { view, onchange } = mountControl({
        renderers,
        propertySchema,
        value: { name: 'Ada', untouched: 'keep' },
        options: { detail: { elements: [{ type: 'Control', scope: '#/properties/name', label }] } },
      });
      expect(view.container.textContent).toContain(label);
      const input = getBySelector<HTMLInputElement>(view.container, 'input[type="text"]');
      expect(input.value).toBe('Ada');
      const before = onchange.mock.calls.length;
      input.value = 'Grace';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const change = await waitForChange(onchange, before);
      expect(change.data.value).toEqual({ name: 'Grace', untouched: 'keep' });
    },
  );

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
      expect(document.querySelector('#skeleton-rename-property')).toBeTruthy();
    });
    const renameInput = document.querySelector<HTMLInputElement>('#skeleton-rename-property')!;
    renameInput.value = 'displayName';
    renameInput.dispatchEvent(new Event('input', { bubbles: true }));

    const before = onchange.mock.calls.length;
    document.querySelector<HTMLButtonElement>('form button[type="submit"]')!.click();
    const changeEvent = await waitForChange(onchange, before);

    expect(changeEvent.data.value).toEqual({ displayName: 'Ada' });
  });

  it('enforces schema name constraints when renaming a dynamic property', async () => {
    const { view, onchange } = mountControl({
      renderers,
      propertySchema: {
        type: 'object',
        propertyNames: { pattern: '^[a-zA-Z]+$' },
        additionalProperties: { type: 'string' },
      },
      value: { nickname: 'Ada' },
    });

    getBySelector<HTMLButtonElement>(view.container, 'button[aria-label="Rename button"]').click();

    await vi.waitFor(() => {
      expect(document.querySelector('#skeleton-rename-property')).toBeTruthy();
    });
    const renameInput = document.querySelector<HTMLInputElement>('#skeleton-rename-property')!;
    renameInput.value = 'display.name';
    renameInput.dispatchEvent(new Event('input', { bubbles: true }));

    const before = onchange.mock.calls.length;
    document.querySelector<HTMLButtonElement>('form button[type="submit"]')!.click();

    await vi.waitFor(() => {
      expect(document.body.textContent).toContain("Property name 'display.name' is invalid");
    });
    expect(onchange.mock.calls).toHaveLength(before);
  });
  it('projects active conditional fields in NoValidation and retains inactive values', async () => {
    const conditionalSchema = {
      type: 'object',
      properties: { kind: { type: 'string' } },
      if: { properties: { kind: { const: 'business' } }, required: ['kind'] },
      then: { properties: { vat: { type: 'string' } } },
      else: { properties: { nickname: { type: 'string' } } },
    } as JsonSchema;
    const { view, onchange } = mountControl({
      renderers,
      propertySchema: conditionalSchema,
      value: { kind: 'business', vat: 'BG123', nickname: 'keep me' },
      options: { conditionalFields: true },
    });
    await view.rerender({ validationMode: 'NoValidation' });
    const values = () =>
      Array.from(view.container.querySelectorAll<HTMLInputElement>('input[type="text"]')).map(
        (input) => input.value,
      );
    expect(values()).toContain('BG123');
    expect(values()).not.toContain('keep me');
    await view.rerender({
      data: { value: { kind: 'personal', vat: 'BG123', nickname: 'keep me' } },
    });
    await vi.waitFor(() => expect(values()).toContain('keep me'));
    expect(values()).not.toContain('BG123');
    expect(onchange.mock.lastCall?.[0].data.value).toEqual({
      kind: 'personal',
      vat: 'BG123',
      nickname: 'keep me',
    });
  });
});
