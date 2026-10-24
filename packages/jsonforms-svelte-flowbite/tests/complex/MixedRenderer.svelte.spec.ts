import { page } from 'vite-plus/test/browser';
import '../test.css';
import { entry as booleanControlRendererEntry } from '../../src/lib/controls/BooleanControlRenderer.entry';
import { flowbiteRenderers } from '../../src/lib/renderers';
import { clearAllIds, type JsonSchema, type Translator } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import { entry as mixedRendererEntry } from '../../src/lib/complex/MixedRenderer.entry';
import { entry as numberControlRendererEntry } from '../../src/lib/controls/NumberControlRenderer.entry';
import { entry as stringControlRendererEntry } from '../../src/lib/controls/StringControlRenderer.entry';
import { getBySelector, mountControl, mountForm, waitForChange } from '../testUtils';

describe('MixedRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(async () => {
    await cleanup();
  });

  const renderers = [mixedRendererEntry, stringControlRendererEntry, numberControlRendererEntry];

  const propertySchema: JsonSchema = {
    title: 'Mixed Value',
    type: ['string', 'number'],
  };

  it('renders type selector and active primitive control', async () => {
    const { view } = await mountControl({
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
    const { view } = await mountControl({
      renderers,
      propertySchema: {
        type: ['array', 'object'],
        items: { type: 'boolean' },
      },
      value: [true],
    });

    let accordionTrigger: HTMLButtonElement | null = null;
    await vi.waitFor(() => {
      accordionTrigger = view.container.querySelector<HTMLButtonElement>('[data-mixed-collapse]');
      expect(accordionTrigger).toBeTruthy();
    });
    expect(accordionTrigger!.getAttribute('aria-expanded')).toBe('true');

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

    getBySelector<HTMLElement>(view.container, '[role="button"][aria-label="Expand"]').click();
    await vi.waitFor(() => {
      expect(view.container.textContent).toContain('Item 0');
      expect(view.container.textContent).not.toContain('[0]');
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
      const { view } = await mountControl({
        renderers: flowbiteRenderers,
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
        expect(detail.querySelector('select')).toBeNull();
        expect(view.container.querySelectorAll('select')).toHaveLength(1);
      });
    },
  );

  it.each([false, true])(
    'centers a boolean checkbox beside its type selector (%s)',
    async (value) => {
      const { view, onchange } = await mountControl({
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
        const selector = getBySelector<HTMLElement>(row, 'select');
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
    const { view, onchange } = await mountControl({
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
      const { view } = await mountControl({
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
        const trigger = getBySelector<HTMLButtonElement>(view.container, '[data-mixed-collapse]');
        expect(trigger.getAttribute('aria-expanded')).toBe('true');
        expect(view.container.querySelector('[role="tree"]')).toBeTruthy();
      });
    },
  );

  it('uses the root type icon and tree node labels in breadcrumbs', async () => {
    const { view } = await mountControl({
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

    let accordionTrigger: HTMLButtonElement | null = null;
    await vi.waitFor(() => {
      accordionTrigger = view.container.querySelector<HTMLButtonElement>('[data-mixed-collapse]');
      expect(accordionTrigger).toBeTruthy();
    });
    expect(accordionTrigger!.getAttribute('aria-expanded')).toBe('true');

    let itemNode: HTMLElement | undefined;
    await vi.waitFor(() => {
      itemNode = Array.from(view.container.querySelectorAll<HTMLElement>('[role="treeitem"]'))
        .filter((node) => node.textContent?.includes('Item 0'))
        .at(-1);
      if (!itemNode) {
        view.container.querySelector<HTMLElement>('[role="button"][aria-label="Expand"]')?.click();
      }
      expect(itemNode).toBeTruthy();
    });
    getBySelector<HTMLButtonElement>(itemNode!, ':scope > button').click();

    await vi.waitFor(() => {
      const breadcrumb = getBySelector<HTMLElement>(
        view.container,
        'nav[aria-label="Navigation path"]',
      );
      expect(breadcrumb.textContent).toContain('Item 0');
      expect(breadcrumb.querySelector('[aria-label="Array root"] svg')).toBeTruthy();
    });
  });

  it.each([{ child: [] }, { child: {} }])(
    'shows a selector above a selected structured child (%j)',
    async ({ child }) => {
      const { view, onchange } = await mountControl({
        renderers: flowbiteRenderers,
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

      let accordionTrigger: HTMLButtonElement | null = null;
      await vi.waitFor(() => {
        accordionTrigger = view.container.querySelector<HTMLButtonElement>('[data-mixed-collapse]');
        expect(accordionTrigger).toBeTruthy();
      });
      expect(accordionTrigger!.getAttribute('aria-expanded')).toBe('true');

      let itemNode: HTMLElement | undefined;
      await vi.waitFor(() => {
        itemNode = Array.from(view.container.querySelectorAll<HTMLElement>('[role="treeitem"]'))
          .filter((node) => node.textContent?.includes('Item 0'))
          .at(-1);
        if (!itemNode) {
          view.container
            .querySelector<HTMLElement>('[role="button"][aria-label="Expand"]')
            ?.click();
        }
        expect(itemNode).toBeTruthy();
      });
      getBySelector<HTMLButtonElement>(itemNode!, ':scope > button').click();

      await vi.waitFor(() => {
        const breadcrumb = getBySelector<HTMLElement>(
          view.container,
          'nav[aria-label="Navigation path"]',
        );
        expect(breadcrumb.textContent).toContain('Item 0');
        expect(breadcrumb.querySelector('[aria-label="Array root"] svg')).toBeTruthy();
      });

      const detail = getBySelector<HTMLElement>(view.container, 'nav').parentElement!;
      await vi.waitFor(() => {
        expect(detail.querySelector('select')).toBeTruthy();
      });
      const selector = getBySelector<HTMLElement>(detail, 'select');
      expect(selector.closest('.flex-col')).toBeTruthy();
      const before = onchange.mock.calls.length;
      const select = selector as HTMLSelectElement;
      select.value = Array.from(select.options).find(
        (option) => option.textContent?.trim().toLowerCase() === 'string',
      )!.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      const change = await waitForChange(onchange, before);
      expect(change.data.value).toEqual(['']);
    },
  );

  it('enforces schema propertyNames when renaming a dynamic tree property', async () => {
    const { view, onchange } = await mountControl({
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

    let accordionTrigger: HTMLButtonElement | null = null;
    await vi.waitFor(() => {
      accordionTrigger = view.container.querySelector<HTMLButtonElement>('[data-mixed-collapse]');
      expect(accordionTrigger).toBeTruthy();
    });
    expect(accordionTrigger!.getAttribute('aria-expanded')).toBe('true');
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

  it('retains the field translation key in delegated mixed inputs across locale changes', async () => {
    const translate = (key: string, fallback = '') =>
      key === 'value.label' ? 'Стойност' : fallback;
    const englishTranslate = (key: string, fallback = '') =>
      key === 'value.label' ? 'Value' : fallback;
    const { view, onchange } = await mountForm({
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
    const { view, onchange } = await mountControl({
      renderers: flowbiteRenderers,
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
    const { view, onchange } = await mountControl({
      renderers: flowbiteRenderers,
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
      const { view, onchange } = await mountForm({
        renderers: flowbiteRenderers,
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
    const { view, onchange } = await mountControl({
      renderers: flowbiteRenderers,
      propertySchema: { type: ['integer', 'number'] },
      value: 2.5,
      i18n: {
        locale: 'fr',
        translate: ((key: string, fallback?: string) =>
          key === 'mixed.integerRequired' ? 'Nombre entier requis.' : fallback) as Translator,
      },
    });
    const select = view.container.querySelector<HTMLSelectElement>('select')!;
    select.value = '0';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    await expect.poll(() => view.container.textContent).toContain('Nombre entier requis.');
    expect(onchange.mock.lastCall?.[0].data.value).toBe(2.5);
    expect(onchange.mock.lastCall?.[0].errors).toHaveLength(0);
  });
});

it('dispatches nested mixed objects without a hidden tree navigation context', async () => {
  const data = { name: 'Ada', child: { name: 'Grace' } };
  const { view, onchange } = await mountForm({
    renderers: flowbiteRenderers,
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
  await cleanup();
});
