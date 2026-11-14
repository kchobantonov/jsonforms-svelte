import { page, userEvent } from 'vite-plus/test/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { clearAllIds, type JsonSchema, type UISchemaElement } from '@jsonforms/core';
import { cleanup } from 'vitest-browser-svelte';
import { flowbiteRenderers } from '../../src/lib/renderers';
import { mountForm, waitForFormChange } from '../testUtils';
import { createTranslator } from '../../../jsonforms-svelte-demo-common/src/lib/i18n/i18n';
import '../test.css';

describe('ListWithDetailRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(async () => {
    await cleanup();
  });

  const renderers = flowbiteRenderers;
  const schema = {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        title: 'Contacts',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              title: 'Name',
            },
          },
          required: ['name'],
        },
      } as unknown as JsonSchema,
    },
  } as JsonSchema;
  const uischema = {
    type: 'ListWithDetail',
    scope: '#/properties/items',
    label: 'Contacts',
  } as UISchemaElement;

  it('uses a localized item label when no primitive label property exists', async () => {
    const { view } = await mountForm({
      renderers,
      schema: {
        type: 'object',
        properties: {
          items: { type: 'array', items: { type: 'object', properties: {} } },
        },
      } as JsonSchema,
      uischema,
      data: { items: [{}] },
      i18n: { locale: 'bg' },
    });
    expect(view.container.querySelector('[data-list-label]')?.textContent).toContain('Елемент 1');
  });

  it('keeps a short list at natural height and scrolls an overflowing list', async () => {
    const { view } = await mountForm({
      renderers,
      schema,
      uischema: { ...uischema, options: { pagination: false } },
      data: { items: [{ name: 'One' }] },
    });
    const list = () => view.container.querySelector<HTMLElement>('[data-list-navigation]')!;
    expect(list().clientHeight).toBeLessThan(256);
    await view.rerender({
      data: { items: Array.from({ length: 20 }, (_, index) => ({ name: `Item ${index}` })) },
    });
    await expect.poll(() => list().scrollHeight).toBeGreaterThan(list().clientHeight);
    expect(list().clientHeight).toBeLessThanOrEqual(384);
  });

  it('keeps native keyboard selection available in a read-only list', async () => {
    const { view, onchange } = await mountForm({
      renderers,
      schema: {
        ...schema,
        properties: {
          items: { ...(schema.properties?.items as JsonSchema), readOnly: true },
        },
      } as JsonSchema,
      uischema,
      data: { items: [{ name: 'Ada' }, { name: 'Bea' }] },
    });
    const changeCount = onchange.mock.calls.length;
    const rows = [...view.container.querySelectorAll<HTMLButtonElement>('button[aria-current]')];
    expect(rows).toHaveLength(2);
    rows[1].focus();
    await userEvent.keyboard('{Enter}');
    await expect
      .poll(() =>
        [...view.container.querySelectorAll<HTMLInputElement>('input')].some(
          (input) => input.value === 'Bea',
        ),
      )
      .toBe(true);
    expect(
      view.container.querySelector('[data-list-navigation]')?.contains(document.activeElement),
    ).toBe(true);
    expect(onchange).toHaveBeenCalledTimes(changeCount);
  });

  it('keeps narrow-row actions pointer-reachable beside a long truncated label', async () => {
    const { view } = await mountForm({
      renderers,
      schema,
      uischema: { ...uischema, options: { showSortButtons: true } },
      data: { items: [{ name: 'A very long company name that must stay inside the label' }] },
    });
    view.container.style.width = '180px';
    const navigation = view.container.querySelector<HTMLElement>('[data-list-navigation]')!;
    const label = view.container.querySelector<HTMLElement>('[data-list-label]')!;
    const action = view.container.querySelector<HTMLElement>(
      '[data-list-actions] button:last-of-type',
    )!;
    expect(label.textContent).toContain('A very long company name');
    await expect
      .element(
        page.getByRole('button', {
          name: /A very long company name that must stay inside the label/,
        }),
      )
      .toBeInTheDocument();
    expect(getComputedStyle(label.querySelector<HTMLElement>('[title]')!).textOverflow).toBe(
      'ellipsis',
    );
    await expect
      .poll(() => {
        navigation.scrollLeft = navigation.scrollWidth;
        const rect = action.getBoundingClientRect();
        const hit = document.elementFromPoint(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
        );
        return hit === action || action.contains(hit);
      })
      .toBe(true);
  });

  it.each([
    { name: 'defaults', config: {}, options: {}, avatar: true },
    { name: 'local hiding', config: {}, options: { hideAvatar: true }, avatar: false },
    { name: 'global hiding', config: { hideAvatar: true }, options: {}, avatar: false },
    {
      name: 'local false override',
      config: { hideAvatar: true },
      options: { hideAvatar: false },
      avatar: true,
    },
  ])('keeps item identity and errors with $name', async ({ config, options, avatar }) => {
    const { view } = await mountForm({
      renderers,
      schema,
      uischema: { ...uischema, options },
      config,
      data: { items: [{}] },
    });
    expect(!!view.container.querySelector('[data-list-avatar]')).toBe(avatar);
    expect(view.container.querySelector('[data-list-item-errors]')).not.toBeNull();
    if (!avatar) expect(view.container.textContent).toContain('Index 1:');
  });

  it('updates the screen-reader item index from the portable catalog when locale changes', async () => {
    const catalog = {
      en: { 'array.indexLabel': 'Row' },
      bg: { 'array.indexLabel': 'Ред' },
    };
    const { view } = await mountForm({
      renderers,
      schema,
      uischema: { ...uischema, options: { hideAvatar: true } },
      data: { items: [{ name: 'Ana' }] },
      i18n: { locale: 'en', translate: createTranslator('en', catalog) },
    });
    const index = () =>
      Array.from(view.container.querySelectorAll('.sr-only'))
        .map((element) => element.textContent?.trim())
        .find((text) => text?.includes('1:'));
    await expect.poll(index).toBe('Row 1:');
    await view.rerender({ i18n: { locale: 'bg', translate: createTranslator('bg', catalog) } });
    await expect.poll(index).toBe('Ред 1:');
  });

  it('localizes the numbered avatar name', async () => {
    const { view } = await mountForm({
      renderers,
      schema,
      uischema,
      data: { items: [{ name: 'Ana' }] },
      i18n: { locale: 'bg' },
    });
    await expect
      .poll(() =>
        view.container.querySelector('[data-list-avatar] [aria-label]')?.getAttribute('aria-label'),
      )
      .toBe('Индекс 1');
  });

  it('renders empty state and enabled add button when no data is provided', async () => {
    const { view } = await mountForm({ renderers, schema, uischema });

    const text = view.container.textContent ?? '';
    expect(text.includes('Contacts')).toBe(true);
    expect(text.includes('No data')).toBe(true);

    const buttons = Array.from(view.container.querySelectorAll<HTMLButtonElement>('button'));
    expect(buttons.length).toBeGreaterThan(0);
    const addButton = buttons[0];
    expect(addButton).toBeTruthy();
    expect(addButton?.disabled).toBe(false);
  });

  it('adds an item and updates core data', async () => {
    const { view, onchange } = await mountForm({
      renderers,
      schema,
      uischema,
      data: { items: [] },
    });

    const buttons = Array.from(view.container.querySelectorAll<HTMLButtonElement>('button'));
    expect(buttons.length).toBeGreaterThan(0);
    const addButton = buttons[0];
    expect(addButton).toBeTruthy();

    const before = onchange.mock.calls.length;
    addButton?.click();
    const changeEvent = await waitForFormChange(onchange, before);

    expect(Array.isArray(changeEvent.data.items)).toBe(true);
    expect((changeEvent.data.items as unknown[]).length).toBe(1);
    await vi.waitFor(() => {
      expect(view.container.textContent).not.toContain('No selection');
      expect(view.container.querySelector('input')).not.toBeNull();
    });
  });

  it('renders list items and updates selection state on click', async () => {
    const { view } = await mountForm({
      renderers,
      schema,
      uischema,
      data: { items: [{ name: 'Ada' }, { name: 'Grace' }] },
    });

    const itemButtons = Array.from(
      view.container.querySelectorAll<HTMLButtonElement>('button[aria-current]'),
    );

    expect(itemButtons).toHaveLength(2);
    expect(itemButtons[0].getAttribute('aria-current')).toBe('false');
    expect(itemButtons[1].getAttribute('aria-current')).toBe('false');
    expect((view.container.textContent ?? '').includes('No selection')).toBe(true);

    itemButtons[1].click();

    await vi.waitFor(() => {
      expect(itemButtons[1].getAttribute('aria-current')).toBe('true');
    });

    expect((view.container.textContent ?? '').includes('No selection')).toBe(false);
  });

  it.each([false, true])(
    'uses a resizable 25/75 split without remounting the selected detail (readOnly=%s)',
    async (readOnly) => {
      await page.viewport(1024, 768);
      const { view, onchange } = await mountForm({
        renderers,
        schema: readOnly
          ? ({
              ...schema,
              properties: {
                items: { ...(schema.properties?.items as JsonSchema), readOnly: true },
              },
            } as JsonSchema)
          : schema,
        uischema,
        data: { items: [{ name: 'Ada' }] },
      });
      const handle = view.container.querySelector<HTMLElement>('[role="separator"]')!;
      await expect.poll(() => Number(handle.getAttribute('aria-valuenow'))).toBe(25);
      expect(handle.getAttribute('aria-valuemin')).toBe('15');
      expect(handle.getAttribute('aria-valuemax')).toBe('60');
      handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      await expect.poll(() => Number(handle.getAttribute('aria-valuenow'))).toBeGreaterThan(25);
      const resized = handle.getAttribute('aria-valuenow');
      view.container.querySelector<HTMLElement>('button[aria-current]')!.click();
      await vi.waitFor(() => {
        const control = [...view.container.querySelectorAll<HTMLInputElement>('input')].find(
          (candidate) => candidate.value === 'Ada',
        );
        expect(control).not.toBeNull();
      });
      const input = [...view.container.querySelectorAll<HTMLInputElement>('input')].find(
        (candidate) => candidate.value === 'Ada',
      );
      if (readOnly) expect(input?.readOnly || input?.disabled).toBe(true);
      expect(view.container.contains(handle)).toBe(true);
      expect(handle.getAttribute('aria-valuenow')).toBe(resized);
      handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      await expect
        .poll(() => Number(handle.getAttribute('aria-valuenow')))
        .toBeGreaterThan(Number(resized));
      expect(
        [...view.container.querySelectorAll<HTMLInputElement>('input')].find(
          (candidate) => candidate.value === 'Ada',
        ),
      ).toBe(input);
      if (!readOnly) {
        const size = handle.getAttribute('aria-valuenow');
        const before = onchange.mock.calls.length;
        input!.value = 'Ava';
        input!.dispatchEvent(new Event('input', { bubbles: true }));
        await waitForFormChange(onchange, before);
        expect(view.container.contains(handle)).toBe(true);
        expect(handle.getAttribute('aria-valuenow')).toBe(size);
        expect(view.container.contains(input!)).toBe(true);
      }
      await page.viewport(414, 896);
    },
  );

  it.each([
    {
      name: 'global elementLabelProp',
      config: { elementLabelProp: 'alias' },
      options: {},
      expected: 'Ada',
    },
    {
      name: 'local elementLabelProp',
      config: {},
      options: { elementLabelProp: 'alias' },
      expected: 'Grace',
    },
  ])('uses $name only for the selected list', async ({ config, options, expected }) => {
    const { view } = await mountForm({
      renderers,
      schema,
      uischema: { ...uischema, options },
      config,
      data: { items: [{ name: 'Ada', alias: 'Grace' }] },
    });
    expect(view.container.querySelector('button[aria-current]')?.textContent).toContain(expected);
  });

  it('uses the local detail descriptor for the selected row', async () => {
    const { view } = await mountForm({
      renderers,
      schema,
      uischema: {
        ...uischema,
        options: { detail: { type: 'Label', text: 'Selected detail' } },
      } as UISchemaElement,
      data: { items: [{ name: 'Ada' }] },
    });
    view.container.querySelector<HTMLElement>('[role="option"], button[aria-current]')!.click();
    await vi.waitFor(() => expect(view.container.textContent).toContain('Selected detail'));
  });

  it('renders a selected primitive item through the detail registry', async () => {
    const primitiveSchema = {
      type: 'object',
      properties: {
        values: { type: 'array', items: { type: 'number' } },
      },
    } as JsonSchema;
    const { view } = await mountForm({
      renderers,
      schema: primitiveSchema,
      uischema: { type: 'ListWithDetail', scope: '#/properties/values' } as UISchemaElement,
      data: { values: [1, 2] },
    });
    view.container.querySelectorAll<HTMLElement>('button[aria-current]')[1].click();
    await vi.waitFor(() => {
      expect(view.container.textContent).not.toContain('No applicable renderer found');
      expect(
        [...view.container.querySelectorAll<HTMLInputElement>('input[type="number"]')].some(
          (input) => input.value === '2',
        ),
      ).toBe(true);
    });
  });

  it('opens a selected referenced allOf item in the detail pane', async () => {
    const composedSchema = {
      type: 'object',
      definitions: {
        entity: { type: 'object', properties: { name: { type: 'string' } } },
        person: {
          allOf: [
            { $ref: '#/definitions/entity' },
            { type: 'object', properties: { notes: { type: 'string' } } },
          ],
        },
      },
      properties: {
        values: { type: 'array', items: { $ref: '#/definitions/person' } },
      },
    } as JsonSchema;
    const { view } = await mountForm({
      renderers,
      schema: composedSchema,
      uischema: { type: 'ListWithDetail', scope: '#/properties/values' } as UISchemaElement,
      data: { values: [{ name: 'Ada', notes: 'Ready' }] },
    });
    view.container.querySelector<HTMLElement>('button[aria-current]')!.click();
    await vi.waitFor(() => {
      expect(view.container.textContent).not.toContain('No applicable renderer found');
      const inputs = [...view.container.querySelectorAll<HTMLInputElement>('input')];
      expect(inputs.some((input) => input.value === 'Ada')).toBe(true);
      expect(inputs.some((input) => input.value === 'Ready')).toBe(true);
    });
  });

  it('keeps an array-level header error when child summaries are hidden', async () => {
    const { view } = await mountForm({
      renderers,
      schema: {
        ...schema,
        properties: { items: { ...(schema.properties?.items as JsonSchema), minItems: 2 } },
      } as JsonSchema,
      uischema: { ...uischema, options: { hideArraySummaryValidation: true } },
      data: { items: [{}] },
    });
    expect(view.container.querySelector('[data-array-summary]')?.textContent?.trim()).toBe('1');
    expect(view.container.querySelector('[data-list-item-errors]')).not.toBeNull();
  });

  it('keeps list-item errors on a literal dotted array separate from a nested lookalike', async () => {
    const array = schema.properties?.items as JsonSchema;
    const { view } = await mountForm({
      renderers,
      schema: {
        type: 'object',
        properties: {
          'items.list': array,
          items: { type: 'object', properties: { list: array } },
        },
      } as JsonSchema,
      uischema: { ...uischema, scope: '#/properties/items.list' } as UISchemaElement,
      data: { 'items.list': [{ name: 'Ada' }], items: { list: [{}] } },
    });
    expect(view.container.querySelector('[data-list-item-errors]')).toBeNull();
    await view.rerender({
      data: { 'items.list': [{}], items: { list: [{ name: 'Nested valid' }] } },
    });
    await vi.waitFor(() =>
      expect(view.container.querySelector('[data-list-item-errors]')).not.toBeNull(),
    );
  });

  it('edits a list beneath a literal dotted parent without changing its nested lookalike', async () => {
    const array = schema.properties?.items as JsonSchema;
    const { view, onchange } = await mountForm({
      renderers,
      schema: {
        type: 'object',
        properties: {
          'records.group': { type: 'object', properties: { items: array } },
          records: {
            type: 'object',
            properties: { group: { type: 'object', properties: { items: array } } },
          },
        },
      } as JsonSchema,
      uischema: {
        ...uischema,
        scope: '#/properties/records.group/properties/items',
      } as UISchemaElement,
      data: {
        'records.group': { items: [{ name: 'Literal' }] },
        records: { group: { items: [{}] } },
      },
    });
    expect(view.container.querySelector('[data-list-item-errors]')).toBeNull();
    expect(view.container.querySelector('[data-list-label]')?.textContent).toContain('Literal');
    view.container.querySelector<HTMLElement>('button[aria-current]')?.click();
    const before = onchange.mock.calls.length;
    await page.getByRole('textbox', { name: 'Name' }).fill('Edited literal');
    const changed = await waitForFormChange(onchange, before);
    expect(changed.data).toEqual({
      'records.group': { items: [{ name: 'Edited literal' }] },
      records: { group: { items: [{}] } },
    });
  });

  it('lets local false keep the array summary when global hiding is true', async () => {
    const { view } = await mountForm({
      renderers,
      schema,
      uischema: { ...uischema, options: { hideArraySummaryValidation: false } },
      config: { hideArraySummaryValidation: true },
      data: { items: [{}] },
    });
    const summary = () => view.container.querySelector('[data-array-summary]');
    await vi.waitFor(() => expect(summary()).not.toBeNull());
    await view.rerender({
      uischema: { ...uischema, options: { hideArraySummaryValidation: true } },
      config: { hideArraySummaryValidation: false },
    });
    expect(summary()).toBeNull();
  });

  it('resolves local restrict against minItems and maxItems without a global override', async () => {
    const constrained = structuredClone(schema) as JsonSchema;
    const array = constrained.properties!.items as JsonSchema;
    array.minItems = 1;
    array.maxItems = 1;
    const { view } = await mountForm({
      renderers,
      schema: constrained,
      uischema: { ...uischema, options: { restrict: true } },
      config: { restrict: false },
      data: { items: [{ name: 'Ada' }] },
    });
    const action = (names: string[]) =>
      [...view.container.querySelectorAll<HTMLButtonElement>('button[aria-label]')].find((button) =>
        names.some((name) => button.getAttribute('aria-label')?.toLowerCase().includes(name)),
      )!;
    const add = () => action(['add']);
    const remove = () => action(['remove', 'delete']);
    expect(add().disabled).toBe(true);
    expect(remove().disabled).toBe(true);
    await view.rerender({
      uischema: { ...uischema, options: { restrict: false } },
      config: { restrict: true },
    });
    expect(add().disabled).toBe(false);
    expect(remove().disabled).toBe(false);
  });

  it('shows local sort controls, reorders rows, and lets local false hide global sort controls', async () => {
    const { view, onchange } = await mountForm({
      renderers,
      schema,
      uischema: { ...uischema, options: { showSortButtons: true } },
      config: { showSortButtons: false },
      data: { items: [{ name: 'Ada' }, { name: 'Grace' }] },
    });
    const down = () =>
      view.container.querySelectorAll<HTMLButtonElement>('button[aria-label*="down" i]');
    expect(down()).toHaveLength(2);
    view.container.querySelector<HTMLElement>('button[aria-current]')!.click();
    await vi.waitFor(() =>
      expect(
        [...view.container.querySelectorAll<HTMLInputElement>('input')].some(
          (input) => input.value === 'Ada',
        ),
      ).toBe(true),
    );
    const selectedEditor = [...view.container.querySelectorAll<HTMLInputElement>('input')].find(
      (input) => input.value === 'Ada',
    )!;
    const before = onchange.mock.calls.length;
    down()[0].click();
    const change = await waitForFormChange(onchange, before);
    expect((change.data.items as Array<{ name: string }>).map((item) => item.name)).toEqual([
      'Grace',
      'Ada',
    ]);
    expect(selectedEditor.value).toBe('Ada');
    expect(view.container.contains(selectedEditor)).toBe(true);
    const selectedRows = view.container.querySelectorAll<HTMLElement>('button[aria-current]');
    expect(selectedRows[1].getAttribute('aria-current')).toBe('true');
    const beforeSelectedEdit = onchange.mock.calls.length;
    selectedEditor.value = 'Ava';
    selectedEditor.dispatchEvent(new Event('input', { bubbles: true }));
    const selectedEdit = await waitForFormChange(onchange, beforeSelectedEdit);
    expect((selectedEdit.data.items as Array<{ name: string }>).map((item) => item.name)).toEqual([
      'Grace',
      'Ava',
    ]);
    await view.rerender({
      uischema: { ...uischema, options: { showSortButtons: false } },
      config: { showSortButtons: true },
    });
    expect(down()).toHaveLength(0);
  });

  it('uses the item fallback when the child label value is removed', async () => {
    const { view } = await mountForm({
      renderers,
      schema,
      uischema,
      data: { items: [{ name: 'Ada' }] },
    });

    const item = view.container.querySelector<HTMLElement>('button[aria-current]');
    const label = item?.querySelector<HTMLElement>('[title]');

    expect(item).toBeTruthy();
    expect(label).toBeTruthy();
    expect(label?.textContent).toBe('Ada');

    item?.click();
    await vi.waitFor(() => expect(view.container.querySelector('input')).toBeTruthy());

    const input = view.container.querySelector<HTMLInputElement>('input');
    input!.value = '';
    input!.dispatchEvent(new Event('input', { bubbles: true }));

    await vi.waitFor(() => {
      expect(label?.textContent).toContain('Item 1');
      expect(item?.textContent).not.toContain('Ada');
    });
  });

  it('constrains long item labels so the remove button remains in the row', async () => {
    const longLabel = `S-1-${'long-label-'.repeat(20)}`;
    const { view } = await mountForm({
      renderers,
      schema,
      uischema,
      data: { items: [{ name: longLabel }] },
    });

    const item = view.container.querySelector<HTMLElement>('button[aria-current]');
    const label = view.container.querySelector<HTMLElement>(`[title="${longLabel}"]`);
    const removeButton = Array.from(
      view.container.querySelectorAll<HTMLButtonElement>('button'),
    ).at(-1);

    expect(item).toBeTruthy();
    expect(label).toBeTruthy();
    expect(removeButton).toBeTruthy();
    expect(item!.classList.contains('min-w-0')).toBe(true);
    expect(item!.classList.contains('overflow-hidden')).toBe(false);
    expect(label!.parentElement?.classList.contains('overflow-hidden')).toBe(true);
    expect(label!.classList.contains('truncate')).toBe(true);
    expect(label!.classList.contains('block')).toBe(true);
  });

  it('removes selected item and updates core data', async () => {
    const { view, onchange } = await mountForm({
      renderers,
      schema,
      uischema,
      data: { items: [{ name: 'Ada' }] },
    });

    const buttons = Array.from(view.container.querySelectorAll<HTMLButtonElement>('button'));
    expect(buttons.length).toBeGreaterThan(0);
    const removeButton = buttons[buttons.length - 1];
    expect(removeButton).toBeTruthy();

    const before = onchange.mock.calls.length;
    removeButton?.click();
    await page.getByRole('dialog').getByRole('button', { name: 'Yes', exact: true }).click();
    const changeEvent = await waitForFormChange(onchange, before);

    expect(Array.isArray(changeEvent.data.items)).toBe(true);
    expect((changeEvent.data.items as unknown[]).length).toBe(0);
  });
  it('keeps selection across pages and flushes detail edits before changing selection', async () => {
    const data = {
      items: Array.from({ length: 6 }, (_, index) => ({ name: `Person ${index + 1}` })),
    };
    const { view, onchange } = await mountForm({
      renderers,
      schema,
      uischema: { ...uischema, options: { pagination: { pageSize: 2 } } },
      data,
    });
    const items = () => [...view.container.querySelectorAll<HTMLElement>('button[aria-current]')];
    expect(items()).toHaveLength(2);
    expect(
      view.container.querySelector<HTMLButtonElement>('button[aria-label="Previous page"]')
        ?.disabled,
    ).toBe(true);
    items()[0].click();
    await vi.waitFor(() =>
      expect(view.container.querySelector<HTMLInputElement>('input')?.value).toBe('Person 1'),
    );
    view.container.querySelector<HTMLButtonElement>('button[aria-label="Next page"]')!.click();
    await vi.waitFor(() => expect(items()[0].textContent).toContain('Person 3'));
    expect(view.container.querySelector<HTMLInputElement>('input')?.value).toBe('Person 1');
    items()[0].click();
    await vi.waitFor(() =>
      expect(view.container.querySelector<HTMLInputElement>('input')?.value).toBe('Person 3'),
    );
    const input = view.container.querySelector<HTMLInputElement>('input')!;
    input.value = 'Edited person';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    items()[1].click();
    await vi.waitFor(() =>
      expect(onchange.mock.lastCall?.[0].data.items[2].name).toBe('Edited person'),
    );
    expect(onchange.mock.lastCall?.[0].data.items[0].name).toBe('Person 1');
    view.container.querySelector<HTMLButtonElement>('button[aria-label="Next page"]')!.click();
    await vi.waitFor(() => expect(items()[0].textContent).toContain('Person 5'));
    expect(
      view.container.querySelector<HTMLButtonElement>('button[aria-label="Next page"]')?.disabled,
    ).toBe(true);
    expect(view.container.querySelector<HTMLInputElement>('input')?.value).toBe('Person 4');
  });

  it.each(['a.b', '', 'a~b~c', '#'])(
    'edits a detail under literal property %j without changing siblings',
    async (key) => {
      const original = {
        [key]: [{ name: 'Ada' }],
        a: { b: [{ name: 'Nested' }] },
        sibling: 'keep',
      };
      const { view, onchange } = await mountForm({
        renderers,
        schema: { type: 'object', properties: { [key]: schema.properties!.items } } as JsonSchema,
        uischema: {
          ...uischema,
          scope: '#/properties/' + key.replaceAll('~', '~0').replaceAll('/', '~1'),
        } as UISchemaElement,
        data: original,
      });
      const rows = () => view.container.querySelectorAll<HTMLButtonElement>('button[aria-current]');
      await expect.poll(() => rows().length).toBe(1);
      rows()[0].click();
      await expect
        .poll(() => view.container.querySelector<HTMLInputElement>('input')?.value)
        .toBe('Ada');
      const input = view.container.querySelector<HTMLInputElement>('input')!;
      const before = onchange.mock.calls.length;
      input.value = 'Grace';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const changed = await waitForFormChange(onchange, before);
      expect(changed.data).toEqual({ ...original, [key]: [{ name: 'Grace' }] });
    },
  );
});
