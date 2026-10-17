import { page } from 'vitest/browser';
import { entry as booleanControlRendererEntry } from '../../src/lib/controls/BooleanControlRenderer.entry';
import { shadcnRenderers } from '../../src/lib/renderers';
import { clearAllIds, type JsonSchema, type Translator } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { entry as mixedRendererEntry } from '../../src/lib/complex/MixedRenderer.entry';
import { entry as numberControlRendererEntry } from '../../src/lib/controls/NumberControlRenderer.entry';
import { entry as stringControlRendererEntry } from '../../src/lib/controls/StringControlRenderer.entry';
import { getBySelector, mountControl, mountForm, waitForChange } from '../testUtils';
import '../test.css';

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
  getComboboxTrigger(container).dispatchEvent(
    new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }),
  );

  let option: HTMLElement | undefined;
  await vi.waitFor(() => {
    option = Array.from(document.querySelectorAll<HTMLElement>('[role="option"]')).find(
      (candidate) => (candidate.textContent ?? '').trim().toLowerCase() === label.toLowerCase(),
    );
    expect(option).toBeTruthy();
  });

  option!.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'mouse' }));
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
    const typeSelector = view.container.querySelector<HTMLElement>('[data-slot="select-trigger"]');
    expect(textInput).toBeTruthy();
    expect(typeSelector).toBeTruthy();
    expect(textInput?.value).toBe('Ada');
    expect(typeSelector?.getBoundingClientRect().height).toBe(
      textInput?.getBoundingClientRect().height,
    );
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

    expect(
      getBySelector<HTMLButtonElement>(view.container, '[data-mixed-collapse]').getAttribute(
        'aria-expanded',
      ),
    ).toBe('true');

    let toggle: HTMLButtonElement | null = null;
    await vi.waitFor(() => {
      toggle = view.container.querySelector<HTMLButtonElement>('button[title="Show primitives"]');
      expect(toggle).toBeTruthy();
    });

    const rootTreeItem = getBySelector<HTMLElement>(
      view.container,
      '[role="treeitem"][aria-selected="true"]',
    );
    expect(rootTreeItem.classList.contains('text-foreground')).toBe(true);
    expect(rootTreeItem.querySelector('svg')?.classList.contains('text-foreground')).toBe(true);

    toggle!.click();
    await vi.waitFor(() => {
      expect(
        view.container.querySelector<HTMLButtonElement>('button[title="Hide primitives"]'),
      ).toBeTruthy();
      expect(view.container.querySelectorAll('[role="treeitem"]').length).toBeGreaterThan(1);
      expect(view.container.textContent).toContain('Item 0');
      expect(view.container.textContent).not.toContain('[0]');
    });

    const primitiveTreeItem = Array.from(
      view.container.querySelectorAll<HTMLElement>('[role="treeitem"]'),
    ).find((treeItem) => treeItem.textContent?.includes('Item 0'));
    expect(primitiveTreeItem).toBeTruthy();
    primitiveTreeItem!.click();

    await vi.waitFor(() => {
      const deleteButton =
        view.container.querySelector<HTMLButtonElement>('button[title="Delete"]');
      expect(deleteButton).toBeTruthy();
      expect(deleteButton?.classList.contains('text-red-600')).toBe(true);
      expect(deleteButton?.classList.contains('text-white')).toBe(false);
    });
    await view.rerender({ i18n: { locale: 'bg' } });
    await vi.waitFor(() => {
      expect(
        view.container.querySelector('button[title="Скриване на простите стойности"]'),
      ).toBeTruthy();
      expect(view.container.textContent).toContain('Елемент 0');
    });
    await view.rerender({
      i18n: {
        locale: 'fr',
        translate: ((key, fallback) =>
          key === 'mixed.hidePrimitives' ? 'Masquer les valeurs' : fallback) as Translator,
      },
    });
    await vi.waitFor(() => {
      expect(view.container.querySelector('button[title="Masquer les valeurs"]')).toBeTruthy();
    });
  });

  it.each([{ value: [] }, { value: {} }])(
    'keeps the structured root selector in the header (%j)',
    async ({ value }) => {
      const { view } = mountControl({
        renderers: shadcnRenderers,
        propertySchema: { type: ['array', 'object'], items: { type: 'string' } },
        value,
      });
      await vi.waitFor(() => {
        expect(view.container.querySelector('[data-mixed-collapse]')).toBeTruthy();
      });
      expect(
        getBySelector<HTMLElement>(view.container, '[data-mixed-collapse]').getAttribute(
          'aria-expanded',
        ),
      ).toBe('true');
      await vi.waitFor(() => {
        const detail = getBySelector<HTMLElement>(view.container, 'nav').parentElement!;
        expect(detail.querySelector('button[aria-haspopup="listbox"]')).toBeNull();
        expect(view.container.querySelectorAll('button[aria-haspopup="listbox"]')).toHaveLength(1);
      });
    },
  );

  it.each([false, true])(
    'centers a boolean checkbox beside its type selector (%s)',
    async (value) => {
      const { view, onchange } = mountControl({
        renderers: [...renderers, booleanControlRendererEntry],
        propertySchema: {
          title: 'Mixed boolean',
          description: 'Boolean help text',
          type: ['boolean', 'string'],
        },
        options: { showUnfocusedDescription: true },
        value,
      });
      let checkbox: HTMLElement;
      await vi.waitFor(() => {
        const row = getBySelector<HTMLElement>(view.container, '[data-mixed-boolean-row]');
        checkbox = getBySelector<HTMLElement>(row, 'input[type="checkbox"], [role="checkbox"]');
        const selector = getBySelector<HTMLElement>(row, 'button[aria-haspopup="listbox"]');
        const a = checkbox.getBoundingClientRect();
        const b = selector.getBoundingClientRect();
        expect(checkbox.getAttribute('aria-label')).toBe('Mixed boolean');
        expect(a.height).toBeGreaterThan(0);
        expect(Math.abs(a.top + a.height / 2 - b.top - b.height / 2)).toBeLessThanOrEqual(1);
        expect(row.textContent).not.toContain('Boolean help text');
        expect(view.container.textContent).toContain('Boolean help text');
      });
      const before = onchange.mock.calls.length;
      checkbox!.click();
      const change = await waitForChange(onchange, before);
      expect(change.data.value).toBe(!value);
    },
  );

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
        const trigger = getBySelector<HTMLButtonElement>(view.container, '[data-mixed-collapse]');
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

    expect(
      getBySelector<HTMLButtonElement>(view.container, '[data-mixed-collapse]').getAttribute(
        'aria-expanded',
      ),
    ).toBe('true');

    const rootTreeItem = getBySelector<HTMLElement>(view.container, '[role="treeitem"]');
    rootTreeItem.querySelector<HTMLButtonElement>('button')?.click();

    let itemNode: HTMLElement | undefined;
    await vi.waitFor(() => {
      itemNode = Array.from(view.container.querySelectorAll<HTMLElement>('[role="treeitem"]'))
        .filter((node) => node.textContent?.includes('Item 0'))
        .at(-1);
      expect(itemNode).toBeTruthy();
    });
    itemNode!.click();

    await vi.waitFor(() => {
      const rootCrumb = getBySelector<HTMLButtonElement>(
        view.container,
        'button[aria-label="Array root"]',
      );
      const breadcrumb = rootCrumb.closest('nav');
      expect(rootCrumb.querySelector('svg')).toBeTruthy();
      expect(breadcrumb?.textContent).toContain('Item 0');
    });
  });

  it.each([{ child: [] }, { child: {} }])(
    'shows a selector above a selected structured child (%j)',
    async ({ child }) => {
      const { view, onchange } = mountControl({
        renderers: shadcnRenderers,
        propertySchema: {
          title: 'Mixed Value',
          type: ['array', 'object'],
          items: {
            type: ['array', 'object', 'string'],
            items: { type: 'string' },
          },
        },
        value: [child],
      });

      expect(
        getBySelector<HTMLButtonElement>(view.container, '[data-mixed-collapse]').getAttribute(
          'aria-expanded',
        ),
      ).toBe('true');

      const rootTreeItem = getBySelector<HTMLElement>(view.container, '[role="treeitem"]');
      rootTreeItem.querySelector<HTMLButtonElement>('button')?.click();

      let itemNode: HTMLElement | undefined;
      await vi.waitFor(() => {
        itemNode = Array.from(view.container.querySelectorAll<HTMLElement>('[role="treeitem"]'))
          .filter((node) => node.textContent?.includes('Item 0'))
          .at(-1);
        expect(itemNode).toBeTruthy();
      });
      itemNode!.click();

      await vi.waitFor(() => {
        const rootCrumb = getBySelector<HTMLButtonElement>(
          view.container,
          'button[aria-label="Array root"]',
        );
        const breadcrumb = rootCrumb.closest('nav');
        expect(rootCrumb.querySelector('svg')).toBeTruthy();
        expect(breadcrumb?.textContent).toContain('Item 0');
      });

      const detail = getBySelector<HTMLElement>(view.container, 'nav').parentElement!;
      await vi.waitFor(() => {
        expect(detail.querySelector('button[aria-haspopup="listbox"]')).toBeTruthy();
      });
      const selector = getBySelector<HTMLElement>(detail, 'button[aria-haspopup="listbox"]');
      expect(selector.closest('.flex-col')).toBeTruthy();
      const before = onchange.mock.calls.length;
      await chooseComboboxOption(detail, 'String');
      const change = await waitForChange(onchange, before);
      expect(change.data.value).toEqual(['']);
    },
  );

  it('enforces schema propertyNames when renaming a dynamic tree property', async () => {
    const { view, onchange } = mountControl({
      renderers,
      propertySchema: {
        title: 'Mixed Value',
        type: ['object', 'string'],
        propertyNames: { pattern: '^[a-zA-Z]+$' },
        additionalProperties: {
          type: 'object',
          additionalProperties: true,
        },
      },
      value: {
        nickname: {},
      },
    });

    expect(
      getBySelector<HTMLButtonElement>(view.container, '[data-mixed-collapse]').getAttribute(
        'aria-expanded',
      ),
    ).toBe('true');

    let renameButton: HTMLButtonElement | null = null;
    await vi.waitFor(() => {
      const rootTreeItem = getBySelector<HTMLElement>(view.container, '[role="treeitem"]');
      rootTreeItem.querySelector<HTMLButtonElement>('button')?.click();
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

    renameInput!.value = 'display.name';
    renameInput!.dispatchEvent(new Event('input', { bubbles: true }));
    const before = onchange.mock.calls.length;
    renameInput!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    await vi.waitFor(() => {
      expect(view.container.textContent).toContain('Property name "display.name" is invalid');
    });
    expect(onchange.mock.calls).toHaveLength(before);
  });

  it('retains the field translation key in delegated mixed inputs across locale changes', async () => {
    const translate = (key: string, fallback = '') =>
      key === 'value.label' ? 'Стойност' : fallback;
    const englishTranslate = (key: string, fallback = '') =>
      key === 'value.label' ? 'Value' : fallback;
    const { view, onchange } = mountForm({
      renderers,
      schema: { type: 'object', properties: { value: { type: ['string', 'number'] } } },
      uischema: { type: 'Control', scope: '#/properties/value', label: 'Value', i18n: 'value' },
      data: { value: 'unchanged' },
      i18n: { locale: 'bg', translate },
    });
    await expect
      .element(page.getByRole('textbox', { name: 'Стойност', exact: true }))
      .toHaveValue('unchanged');
    await view.rerender({
      i18n: {
        locale: 'en',
        translate: englishTranslate,
      },
    });
    await expect
      .element(page.getByRole('textbox', { name: 'Value', exact: true }))
      .toHaveValue('unchanged');
    expect(onchange.mock.lastCall?.[0].data.value).toBe('unchanged');
  });
  it('dispatches explicit mixed compositions without losing their data or constraints', async () => {
    const { view, onchange } = mountControl({
      renderers: shadcnRenderers,
      propertySchema: {
        type: ['string', 'number'],
        oneOf: [
          { type: 'string', minLength: 3 },
          { type: 'number', minimum: 5 },
        ],
      },
      value: 'abcd',
    });
    await expect
      .poll(() => view.container.querySelector<HTMLInputElement>('input[type="text"]')?.value)
      .toBe('abcd');
    expect(onchange.mock.lastCall?.[0].data.value).toBe('abcd');
    expect(onchange.mock.lastCall?.[0].errors).toHaveLength(0);
  });
  it('keeps imported forbidden array items available without crashing the tree', async () => {
    const { view, onchange } = mountControl({
      renderers: shadcnRenderers,
      propertySchema: { type: ['array', 'null'], items: false } as unknown as JsonSchema,
      value: [1],
    });
    await expect.poll(() => onchange.mock.lastCall?.[0].data.value).toEqual([1]);
    expect(onchange.mock.lastCall?.[0].errors.length).toBeGreaterThan(0);
    expect(view.container.querySelector('button')).not.toBeNull();
  });
  it.each([true, false])(
    'renders boolean root schema %s without changing imported data',
    async (schema) => {
      const { view, onchange } = mountForm({
        renderers: shadcnRenderers,
        schema: schema as unknown as JsonSchema,
        uischema: { type: 'Control', scope: '#' },
        data: 'kept',
      });
      await expect
        .poll(() =>
          [...view.container.querySelectorAll<HTMLInputElement>('input')].some(
            (input) => input.value === 'kept',
          ),
        )
        .toBe(true);
      expect(onchange.mock.lastCall?.[0].data).toBe('kept');
      if (schema) expect(onchange.mock.lastCall?.[0].errors).toHaveLength(0);
      else expect(onchange.mock.lastCall?.[0].errors[0].keyword).toBe('false schema');
    },
  );
  it('retains fractional data when choosing the integer editor and shows local feedback', async () => {
    const { view, onchange } = mountControl({
      renderers: shadcnRenderers,
      propertySchema: { type: ['integer', 'number'] },
      value: 2.5,
      i18n: {
        locale: 'fr',
        translate: ((key: string, fallback?: string) =>
          key === 'mixed.integerRequired' ? 'Nombre entier requis.' : fallback) as Translator,
      },
    });
    await chooseComboboxOption(view.container, 'integer');
    await expect.poll(() => view.container.textContent).toContain('Nombre entier requis.');
    expect(onchange.mock.lastCall?.[0].data.value).toBe(2.5);
    expect(onchange.mock.lastCall?.[0].errors).toHaveLength(0);
  });
});

it('dispatches nested mixed objects without a hidden tree navigation context', async () => {
  const data = { name: 'Ada', child: { name: 'Grace' } };
  const { view, onchange } = mountForm({
    renderers: shadcnRenderers,
    schema: {
      type: ['object', 'null'],
      properties: {
        name: { type: 'string' },
        child: { type: ['object', 'null'], properties: { name: { type: 'string' } } },
      },
    },
    uischema: { type: 'Control', scope: '#', options: { structuredLayout: 'nested' } },
    config: { jsonformsExtended: { mixed: { structuredLayout: 'nested' } } },
    data,
  });
  await vi.waitFor(() => {
    const values = Array.from(view.container.querySelectorAll<HTMLInputElement>('input')).map(
      (input) => input.value,
    );
    expect(values).toContain('Ada');
    expect(values).toContain('Grace');
  });
  expect(view.container.querySelector('[role="tree"]')).toBeNull();
  const input = Array.from(view.container.querySelectorAll<HTMLInputElement>('input')).find(
    (input) => input.value === 'Grace',
  )!;
  input.value = 'Updated';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await vi.waitFor(() =>
    expect(onchange.mock.lastCall?.[0].data).toEqual({ name: 'Ada', child: { name: 'Updated' } }),
  );
  cleanup();
});
