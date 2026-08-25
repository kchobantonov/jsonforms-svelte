import { clearAllIds, type JsonSchema } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { entry as mixedRendererEntry } from '../../src/lib/complex/MixedRenderer.entry';
import { entry as numberControlRendererEntry } from '../../src/lib/controls/NumberControlRenderer.entry';
import { entry as stringControlRendererEntry } from '../../src/lib/controls/StringControlRenderer.entry';
import { getBySelector, mountControl, waitForChange } from '../testUtils';

describe('MixedRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(() => {
    cleanup();
  });

  const renderers = [mixedRendererEntry, stringControlRendererEntry, numberControlRendererEntry];

  const propertySchema: JsonSchema = {
    title: 'Mixed Value',
    type: ['string', 'number'],
  };

  it('renders type selector and active primitive control', () => {
    const { view } = mountControl({
      renderers,
      propertySchema,
      value: 'Ada',
    });

    const select = view.container.querySelector<HTMLSelectElement>('select');
    expect(select).toBeTruthy();

    const textInput = view.container.querySelector<HTMLInputElement>('input[type="text"]');
    expect(textInput).toBeTruthy();
    expect(textInput?.value).toBe('Ada');
  });

  it('keeps the primitive toggle visible for a primitive-only root tree', async () => {
    const { view } = mountControl({
      renderers,
      propertySchema: {
        type: ['array', 'object'],
        items: { type: 'boolean' },
      },
      value: [true],
    });

    let accordionTrigger: HTMLButtonElement | null = null;
    await vi.waitFor(() => {
      accordionTrigger = view.container.querySelector<HTMLButtonElement>(
        'h2 > button[aria-expanded]',
      );
      expect(accordionTrigger).toBeTruthy();
    });
    accordionTrigger!.click();

    let toggle: HTMLButtonElement | null = null;
    await vi.waitFor(() => {
      toggle = view.container.querySelector<HTMLButtonElement>('button[title="Show primitives"]');
      expect(toggle).toBeTruthy();
    });

    toggle!.click();
    await vi.waitFor(() => {
      expect(
        view.container.querySelector<HTMLButtonElement>('button[title="Hide primitives"]'),
      ).toBeTruthy();
    });

    getBySelector<HTMLElement>(
      view.container,
      '[role="button"][aria-label="Expand"]',
    ).click();
    await vi.waitFor(() => {
      expect(view.container.textContent).toContain('Item 0');
      expect(view.container.textContent).not.toContain('[0]');
    });
  });

  it('updates core data when switching mixed type', async () => {
    const { view, onchange } = mountControl({
      renderers,
      propertySchema,
      value: 'Ada',
    });

    const select = view.container.querySelector<HTMLSelectElement>('select');
    expect(select).toBeTruthy();

    const numberOption = Array.from(select!.options).find((option) =>
      option.textContent?.toLowerCase().includes('number'),
    );
    const fallbackOption = Array.from(select!.options).find(
      (option) => option.value !== '' && option.value !== select!.value,
    );

    const nextOption = numberOption ?? fallbackOption;
    expect(nextOption).toBeTruthy();

    const before = onchange.mock.calls.length;
    select!.value = nextOption!.value;
    select!.dispatchEvent(new Event('change', { bubbles: true }));
    const changeEvent = await waitForChange(onchange, before);

    if (numberOption) {
      expect(typeof changeEvent.data.value).toBe('number');
    } else {
      expect(changeEvent.data.value).not.toBe('Ada');
    }
  });

  it.each(['array', 'object'] as const)(
    'opens the editor panel when switching to %s',
    async (type) => {
      const { view } = mountControl({
        renderers,
        propertySchema: {
          title: 'Mixed Value',
          type: ['string', 'array', 'object'],
          items: { type: 'string' },
          additionalProperties: true,
        },
        value: 'Ada',
      });

      const select = getBySelector<HTMLSelectElement>(view.container, 'select');
      const option = Array.from(select.options).find(
        (candidate) => candidate.textContent?.trim().toLowerCase() === type,
      );
      expect(option).toBeTruthy();

      select.value = option!.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));

      await vi.waitFor(() => {
        const trigger = getBySelector<HTMLButtonElement>(
          view.container,
          'h2 > button[aria-expanded]',
        );
        expect(trigger.getAttribute('aria-expanded')).toBe('true');
        expect(view.container.querySelector('[role="tree"]')).toBeTruthy();
      });
    },
  );

  it('rejects JSON Forms path characters when renaming a dynamic tree property', async () => {
    const { view, onchange } = mountControl({
      renderers,
      propertySchema: {
        title: 'Mixed Value',
        type: ['object', 'string'],
        additionalProperties: {
          type: 'object',
          additionalProperties: true,
        },
      },
      value: {
        nickname: {},
      },
    });

    let accordionTrigger: HTMLButtonElement | null = null;
    await vi.waitFor(() => {
      accordionTrigger = view.container.querySelector<HTMLButtonElement>(
        'h2 > button[aria-expanded]',
      );
      expect(accordionTrigger).toBeTruthy();
    });
    accordionTrigger!.click();
    await vi.waitFor(() => {
      expect(view.container.querySelector('[role="tree"]')).toBeTruthy();
    });

    let renameButton: HTMLButtonElement | null = null;
    await vi.waitFor(() => {
      renameButton = view.container.querySelector<HTMLButtonElement>('button[title="Rename"]');
      if (!renameButton) {
        view.container.querySelector<HTMLElement>('[role="button"][aria-label="Expand"]')?.click();
        renameButton = view.container.querySelector<HTMLButtonElement>('button[title="Rename"]');
      }
      expect(renameButton).toBeTruthy();
    });
    renameButton!.click();

    let renameInput: HTMLInputElement | undefined;
    await vi.waitFor(() => {
      renameInput = Array.from(view.container.querySelectorAll<HTMLInputElement>('input')).find(
        (input) => input.value === 'nickname',
      );
      expect(renameInput).toBeTruthy();
    });

    renameInput!.value = 'display]name[';
    renameInput!.dispatchEvent(new Event('input', { bubbles: true }));
    const before = onchange.mock.calls.length;
    renameInput!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    await vi.waitFor(() => {
      expect(view.container.textContent).toContain('Property name "display]name[" is invalid');
    });
    expect(onchange.mock.calls).toHaveLength(before);
  });
});
