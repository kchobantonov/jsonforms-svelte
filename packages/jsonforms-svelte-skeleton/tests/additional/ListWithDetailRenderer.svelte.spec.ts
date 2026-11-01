import { page } from 'vite-plus/test/browser';
import { clearAllIds, type JsonSchema, type UISchemaElement } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import { skeletonRenderers } from '../../src/lib/renderers';
import { mountForm, waitForFormChange } from '../testUtils';

describe('ListWithDetailRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(async () => {
    await cleanup();
  });

  const renderers = skeletonRenderers;
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

  it('updates the screen-reader item index when the form locale changes', async () => {
    const { view } = await mountForm({
      renderers,
      schema,
      uischema: { ...uischema, options: { hideAvatar: true } },
      data: { items: [{ name: 'Ana' }] },
      i18n: { locale: 'en' },
    });
    const index = () =>
      Array.from(view.container.querySelectorAll('.sr-only'))
        .map((element) => element.textContent?.trim())
        .find((text) => text?.includes('1:'));
    await expect.poll(index).toBe('Index 1:');
    await view.rerender({ i18n: { locale: 'bg' } });
    await expect.poll(index).toBe('Индекс 1:');
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
  });

  it('renders list items and updates selection state on click', async () => {
    const { view } = await mountForm({
      renderers,
      schema,
      uischema,
      data: { items: [{ name: 'Ada' }, { name: 'Grace' }] },
    });

    const items = Array.from(view.container.querySelectorAll<HTMLElement>('[role="option"]'));
    expect(items).toHaveLength(2);
    expect((view.container.textContent ?? '').includes('No selection')).toBe(true);

    items[1].dispatchEvent(new MouseEvent('click', { bubbles: true }));

    await vi.waitFor(() => {
      expect((view.container.textContent ?? '').includes('No selection')).toBe(false);
    });
  });

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
    expect(view.container.querySelector('[role="option"]')?.textContent).toContain(expected);
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
    const before = onchange.mock.calls.length;
    down()[0].click();
    const change = await waitForFormChange(onchange, before);
    expect((change.data.items as Array<{ name: string }>).map((item) => item.name)).toEqual([
      'Grace',
      'Ada',
    ]);
    await view.rerender({
      uischema: { ...uischema, options: { showSortButtons: false } },
      config: { showSortButtons: true },
    });
    expect(down()).toHaveLength(0);
  });

  it('keeps the list label empty when the child label value is removed', async () => {
    const { view } = await mountForm({
      renderers,
      schema,
      uischema,
      data: { items: [{ name: 'Ada' }] },
    });

    const item = view.container.querySelector<HTMLElement>('[role="option"]');
    const label = item?.querySelector<HTMLElement>('p');

    expect(item).toBeTruthy();
    expect(label).toBeTruthy();
    expect(label?.textContent).toBe('Ada');

    item?.click();
    await vi.waitFor(() => expect(view.container.querySelector('input')).toBeTruthy());

    const input = view.container.querySelector<HTMLInputElement>('input');
    input!.value = '';
    input!.dispatchEvent(new Event('input', { bubbles: true }));

    await vi.waitFor(() => {
      expect(label?.textContent).toBe('');
      expect(item?.textContent).not.toContain('Item 1');
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

    const item = view.container.querySelector<HTMLElement>('[role="option"]');
    const label = view.container.querySelector<HTMLElement>(`[title="${longLabel}"]`);
    const removeButton = Array.from(
      view.container.querySelectorAll<HTMLButtonElement>('button'),
    ).at(-1);

    expect(item).toBeTruthy();
    expect(label).toBeTruthy();
    expect(removeButton).toBeTruthy();
    expect(item!.classList.contains('min-w-0')).toBe(true);
    expect(item!.classList.contains('overflow-hidden')).toBe(true);
    expect(label!.classList.contains('truncate')).toBe(true);
    expect(label!.parentElement?.classList.contains('min-w-0')).toBe(true);
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
    const items = () => [...view.container.querySelectorAll<HTMLElement>('[role="option"]')];
    expect(items()).toHaveLength(2);
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
      const rows = () => view.container.querySelectorAll<HTMLElement>('[role="option"]');
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
