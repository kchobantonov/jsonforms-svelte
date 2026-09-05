import { clearAllIds, type JsonSchema } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { entry as mixedRendererEntry } from '../../src/lib/complex/MixedRenderer.entry';
import { entry as numberControlRendererEntry } from '../../src/lib/controls/NumberControlRenderer.entry';
import { entry as stringControlRendererEntry } from '../../src/lib/controls/StringControlRenderer.entry';
import { getBySelector, mountControl, waitForChange } from '../testUtils';

const getComboboxTrigger = (container: HTMLElement): HTMLButtonElement => {
  const byRole = container.querySelector<HTMLButtonElement>('button[aria-haspopup="listbox"]');
  if (byRole) return byRole;

  const byPart = container.querySelector<HTMLButtonElement>('button[data-part="trigger"]');
  if (byPart) return byPart;

  const fallback = Array.from(container.querySelectorAll<HTMLButtonElement>('button')).find(
    (button) => (button.getAttribute('aria-label') ?? '').toLowerCase() !== 'clear value',
  );
  expect(fallback).toBeTruthy();
  return fallback as HTMLButtonElement;
};

const chooseComboboxOption = async (container: HTMLElement, label: string) => {
  getComboboxTrigger(container).click();

  let option: HTMLElement | undefined;
  await vi.waitFor(() => {
    option = Array.from(document.querySelectorAll<HTMLElement>('[role="option"]')).find(
      (candidate) => (candidate.textContent ?? '').trim().toLowerCase() === label.toLowerCase(),
    );
    expect(option).toBeTruthy();
  });

  option!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
};

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

    const input = view.container.querySelector<HTMLInputElement>('input[id$="-input"]');
    expect(input).toBeTruthy();

    const textInput = Array.from(
      view.container.querySelectorAll<HTMLInputElement>('input[type="text"]'),
    ).find((candidate) => candidate.value === 'Ada');
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

    getBySelector<HTMLElement>(view.container, '[data-part="item-trigger"]').click();

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
      expect(view.container.querySelectorAll('[role="treeitem"]').length).toBeGreaterThan(1);
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

    const before = onchange.mock.calls.length;
    await chooseComboboxOption(view.container, 'Number');
    const changeEvent = await waitForChange(onchange, before);

    expect(typeof changeEvent.data.value).toBe('number');
  });

  it.each(['Array', 'Object'] as const)(
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

      await chooseComboboxOption(view.container, type);

      await vi.waitFor(() => {
        const trigger = getBySelector<HTMLElement>(view.container, '[data-part="item-trigger"]');
        expect(trigger.getAttribute('aria-expanded')).toBe('true');
        expect(view.container.querySelector('[role="tree"]')).toBeTruthy();
      });
    },
  );

  it('uses the root type icon and tree node labels in breadcrumbs', async () => {
    const { view } = mountControl({
      renderers,
      propertySchema: {
        title: 'Mixed Value',
        type: ['array', 'object'],
        items: {
          type: ['array', 'string'],
          items: { type: 'string' },
        },
      },
      value: [[]],
    });

    getBySelector<HTMLElement>(view.container, '[data-part="item-trigger"]').click();

    let itemNode: HTMLElement | undefined;
    await vi.waitFor(() => {
      itemNode = Array.from(view.container.querySelectorAll<HTMLElement>('[role="treeitem"]'))
        .filter((node) => node.textContent?.includes('Item 0'))
        .at(-1);
      expect(itemNode).toBeTruthy();
    });
    itemNode!.click();

    await vi.waitFor(() => {
      const breadcrumb = getBySelector<HTMLElement>(
        view.container,
        'nav[aria-label="Navigation path"]',
      );
      expect(breadcrumb.textContent).toContain('Item 0');
      expect(breadcrumb.querySelector('button[aria-label="Array root"] svg')).toBeTruthy();
    });
  });

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

    getBySelector<HTMLElement>(view.container, '[data-part="item-trigger"]').click();

    let renameButton: HTMLButtonElement | null = null;
    await vi.waitFor(() => {
      getBySelector<HTMLElement>(view.container, '[role="treeitem"]').click();
      renameButton = view.container.querySelector<HTMLButtonElement>('button[title="Rename"]');
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

    renameInput!.value = 'display[name]';
    renameInput!.dispatchEvent(new Event('input', { bubbles: true }));
    const before = onchange.mock.calls.length;
    renameInput!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    await vi.waitFor(() => {
      expect(view.container.textContent).toContain('Property name "display[name]" is invalid');
    });
    expect(onchange.mock.calls).toHaveLength(before);
  });
});
