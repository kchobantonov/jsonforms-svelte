import { clearAllIds, type JsonSchema, type UISchemaElement } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import { entry as arrayControlRendererEntry } from '../../src/lib/complex/ArrayControlRenderer.entry';
import { entry as stringControlRendererEntry } from '../../src/lib/controls/StringControlRenderer.entry';
import { entry as arrayLayoutRendererEntry } from '../../src/lib/layouts/ArrayLayoutRenderer.entry';
import { entry as layoutRendererEntry } from '../../src/lib/layouts/LayoutRenderer.entry';
import { expectValidationError, getBySelector, mountForm, waitForFormChange } from '../testUtils';

describe('ArrayLayoutRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(async () => {
    await cleanup();
  });

  const renderers = [arrayLayoutRendererEntry, layoutRendererEntry, stringControlRendererEntry];

  it.each([
    {
      name: 'nested array',
      item: { type: 'array', items: { type: 'string' } },
      options: {},
      expected: [],
    },
    {
      name: 'null item with table disabled',
      item: { type: 'null' },
      options: { table: false },
      expected: null,
    },
  ])('adds a $name through the expandable presentation', async ({ item, options, expected }) => {
    const { view, onchange } = await mountForm({
      renderers: [arrayControlRendererEntry, ...renderers],
      schema: {
        type: 'object',
        properties: {
          items: { type: 'array', items: item },
        },
      } as JsonSchema,
      uischema: { type: 'Control', scope: '#/properties/items', options },
      data: { items: [] },
    });
    const add = [...view.container.querySelectorAll<HTMLButtonElement>('button')].find((button) =>
      button.getAttribute('aria-label')?.toLowerCase().includes('add'),
    );
    expect(add).toBeTruthy();
    const before = onchange.mock.calls.length;
    add!.click();
    expect((await waitForFormChange(onchange, before)).data.items).toEqual([expected]);
  });

  it.each([
    {
      name: 'null table item',
      definition: { type: 'null' },
      options: { table: true },
      expected: null,
      table: true,
    },
    {
      name: 'null expandable item',
      definition: { type: 'null' },
      options: { table: false },
      expected: null,
      table: false,
    },
    {
      name: 'nested array item',
      definition: { type: 'array', items: { type: 'string' } },
      options: {},
      expected: [],
      table: false,
    },
  ])('resolves a referenced $name for Add', async ({ definition, options, expected, table }) => {
    const { view, onchange } = await mountForm({
      renderers: [arrayControlRendererEntry, ...renderers],
      schema: {
        type: 'object',
        $defs: { Item: definition },
        properties: { items: { type: 'array', items: { $ref: '#/$defs/Item' } } },
      } as JsonSchema,
      uischema: { type: 'Control', scope: '#/properties/items', options },
      data: { items: [] },
    });
    expect(view.container.querySelector('table') !== null).toBe(table);
    const add = [...view.container.querySelectorAll<HTMLButtonElement>('button')].find((button) =>
      button.getAttribute('aria-label')?.toLowerCase().includes('add'),
    );
    expect(add).toBeTruthy();
    const before = onchange.mock.calls.length;
    add!.click();
    expect((await waitForFormChange(onchange, before)).data.items).toEqual([expected]);
  });

  it.each([
    { combinator: 'oneOf', referenced: false, table: false },
    { combinator: 'anyOf', referenced: false, table: false },
    { combinator: 'allOf', referenced: false, table: false },
    { combinator: 'oneOf', referenced: true, table: false },
    { combinator: 'oneOf', referenced: false, table: true },
  ] as const)(
    'adds a $combinator item (ref=$referenced, table=$table)',
    async ({ combinator, referenced, table }) => {
      const item = {
        [combinator]: [
          { type: 'object', properties: { flag: { type: 'boolean', default: true } } },
          { type: 'string' },
        ],
      };
      const { view, onchange } = await mountForm({
        renderers: [arrayControlRendererEntry, ...renderers],
        schema: {
          type: 'object',
          ...(referenced ? { $defs: { Item: item } } : {}),
          properties: {
            items: {
              type: 'array',
              items: referenced ? { $ref: '#/$defs/Item' } : item,
            },
          },
        } as JsonSchema,
        uischema: { type: 'Control', scope: '#/properties/items', options: { table } },
        data: { items: [] },
      });
      expect(view.container.querySelector('table') !== null).toBe(table);
      const add = [...view.container.querySelectorAll<HTMLButtonElement>('button')].find((button) =>
        button.getAttribute('aria-label')?.toLowerCase().includes('add'),
      );
      expect(add).toBeTruthy();
      const before = onchange.mock.calls.length;
      add!.click();
      expect((await waitForFormChange(onchange, before)).data.items).toEqual([{ flag: true }]);
    },
  );

  it('keeps a typed object/allOf item in the expandable presentation', async () => {
    const { view } = await mountForm({
      renderers: [arrayControlRendererEntry, ...renderers],
      schema: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {},
              allOf: [{ properties: { flag: { type: 'boolean', default: true } } }],
            },
          },
        },
      } as JsonSchema,
      uischema: { type: 'Control', scope: '#/properties/items' },
      data: { items: [] },
    });
    expect(view.container.querySelector('table')).toBeNull();
  });

  it.each([
    { name: 'local', config: {}, options: { disableAdd: true, disableRemove: true } },
    {
      name: 'global',
      config: { disableAdd: true, disableRemove: true },
      options: {},
    },
  ])(
    'keeps reorder available when $name Add and Remove are disabled',
    async ({ config, options }) => {
      const { view, onchange } = await mountForm({
        renderers,
        config,
        schema: {
          type: 'object',
          properties: { items: { type: 'array', items: { type: 'string' } } },
        } as JsonSchema,
        uischema: {
          type: 'Control',
          scope: '#/properties/items',
          options: { table: false, showSortButtons: true, ...options },
        },
        data: { items: ['first', 'second'] },
      });
      const buttons = [...view.container.querySelectorAll<HTMLButtonElement>('button')];
      const named = (part: string) =>
        buttons.filter((button) => button.getAttribute('aria-label')?.toLowerCase().includes(part));
      expect(named('add')[0]?.disabled).toBe(true);
      expect(named('delete')).toHaveLength(2);
      expect(named('delete').every((button) => button.disabled)).toBe(true);
      const down = named('move item down').find((button) => !button.disabled);
      expect(down).toBeTruthy();
      const before = onchange.mock.calls.length;
      down!.click();
      expect((await waitForFormChange(onchange, before)).data.items).toEqual(['second', 'first']);
    },
  );

  it.each([true, false])(
    'applies restrict=%s to expandable Delete at minItems',
    async (restrict) => {
      const { view, onchange } = await mountForm({
        renderers,
        schema: {
          type: 'object',
          properties: { items: { type: 'array', minItems: 1, items: { type: 'string' } } },
        } as JsonSchema,
        uischema: {
          type: 'Control',
          scope: '#/properties/items',
          options: { table: false, restrict, confirmation: { delete: 'never' } },
        },
        data: { items: ['first'] },
      });
      const remove = view.container.querySelector<HTMLButtonElement>(
        'button[aria-label^="Delete"]',
      );
      expect(remove).not.toBeNull();
      expect(remove!.disabled).toBe(restrict);
      const before = onchange.mock.calls.length;
      remove!.click();
      if (restrict) {
        await new Promise(requestAnimationFrame);
        expect(onchange.mock.calls.length).toBe(before);
      } else {
        expect((await waitForFormChange(onchange, before)).data.items).toEqual([]);
      }
    },
  );

  it('initializes a date-time item from the current time in expandable mode', async () => {
    const { view, onchange } = await mountForm({
      renderers,
      schema: {
        type: 'object',
        properties: { items: { type: 'array', items: { type: 'string', format: 'date-time' } } },
      } as JsonSchema,
      uischema: { type: 'Control', scope: '#/properties/items', options: { table: false } },
      data: { items: [] },
    });
    const add = [...view.container.querySelectorAll<HTMLButtonElement>('button')].find((button) =>
      button.getAttribute('aria-label')?.toLowerCase().includes('add'),
    );
    expect(add).toBeTruthy();
    const beforeTime = Date.now();
    const before = onchange.mock.calls.length;
    add!.click();
    const value = (await waitForFormChange(onchange, before)).data.items as string[];
    expect(Date.parse(value[0])).toBeGreaterThanOrEqual(beforeTime);
    expect(Date.parse(value[0])).toBeLessThanOrEqual(Date.now());
  });

  it.each([
    { name: 'default', options: {}, table: true },
    { name: 'explicit table false', options: { table: false }, table: false },
    { name: 'generated detail', options: { detail: 'GENERATE' }, table: false },
    { name: 'registered detail', options: { detail: 'REGISTERED' }, table: false },
    {
      name: 'inline detail',
      options: {
        detail: {
          type: 'VerticalLayout',
          elements: [{ type: 'Control', scope: '#/properties/name' }],
        },
      },
      table: false,
    },
    { name: 'default detail', options: { detail: 'DEFAULT' }, table: true },
    { name: 'forced table', options: { table: true, detail: 'GENERATE' }, table: true },
    { name: 'table format', options: { table: false, format: 'table' }, table: true },
  ])('selects the $name presentation for flat object arrays', async ({ options, table }) => {
    const { view } = await mountForm({
      renderers: [arrayControlRendererEntry, ...renderers],
      schema,
      uischema: { ...uischema, options },
      data: { items: [{ name: 'Ada' }] },
    });
    expect(view.container.querySelector('table') !== null).toBe(table);
  });

  it('selects expandable items for a primitive array with table: false', async () => {
    const { view } = await mountForm({
      renderers: [arrayControlRendererEntry, ...renderers],
      schema: {
        type: 'object',
        properties: { items: { type: 'array', items: { type: 'string' } } },
      },
      uischema: { ...uischema, options: { table: false } },
      data: { items: ['Ada'] },
    });
    expect(view.container.querySelector('table')).toBeNull();
    expect(view.container.querySelector('input')?.value).toBe('Ada');
  });

  const itemSchema = {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        title: 'Name',
        minLength: 2,
      },
    },
    required: ['name'],
  } as JsonSchema;

  const schema = {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        title: 'Items',
        items: itemSchema,
      } as unknown as JsonSchema,
    },
  } as JsonSchema;

  const uischema: UISchemaElement = {
    type: 'Control',
    scope: '#/properties/items',
    options: {
      detail: 'GENERATED',
    },
  };

  it.each([
    { name: 'defaults', config: {}, options: {}, avatar: true, summary: true },
    {
      name: 'local hiding',
      config: {},
      options: { hideAvatar: true, hideArraySummaryValidation: true },
      avatar: false,
      summary: false,
    },
    {
      name: 'global hiding',
      config: { hideAvatar: true, hideArraySummaryValidation: true },
      options: {},
      avatar: false,
      summary: false,
    },
    {
      name: 'local false override',
      config: { hideAvatar: true, hideArraySummaryValidation: true },
      options: { hideAvatar: false, hideArraySummaryValidation: false },
      avatar: true,
      summary: true,
    },
  ])('keeps row identity and errors with $name', async ({ config, options, avatar, summary }) => {
    const { view } = await mountForm({
      renderers,
      schema,
      uischema: {
        ...uischema,
        options: { ...uischema.options, elementLabelProp: 'name', ...options },
      },
      config,
      data: { items: [{ name: 'x' }] },
    });
    expect(!!view.container.querySelector('[data-array-avatar]')).toBe(avatar);
    expect(!!view.container.querySelector('[data-array-summary]')).toBe(summary);
    expect(view.container.querySelector('[data-row-summary]')).not.toBeNull();
    if (!avatar) expect(view.container.textContent).toContain('Index 1:');
  });

  it('updates the hidden item index when the form locale changes', async () => {
    const { view } = await mountForm({
      renderers,
      schema,
      uischema: { ...uischema, options: { ...uischema.options, hideAvatar: true } },
      data: { items: [{ name: 'Ada' }] },
      i18n: { locale: 'en' },
    });
    const index = () =>
      [...view.container.querySelectorAll('.sr-only')]
        .map((element) => element.textContent?.trim())
        .find((text) => text?.endsWith('1:'));
    await expect.poll(index).toBe('Index 1:');
    await view.rerender({ i18n: { locale: 'bg' } });
    await expect.poll(index).toBe('Индекс 1:');
  });

  it('keeps an array-level error in the header when child summaries are hidden', async () => {
    const { view } = await mountForm({
      renderers,
      schema: {
        ...schema,
        properties: {
          items: { ...schema.properties!.items, minItems: 2 },
        },
      } as JsonSchema,
      uischema: {
        ...uischema,
        options: { ...uischema.options, hideArraySummaryValidation: true },
      },
      data: { items: [{ name: 'x' }] },
    });
    expect(view.container.querySelector('[data-array-summary]')?.textContent?.trim()).toBe('1');
    expect(view.container.querySelector('[data-row-summary]')).not.toBeNull();
  });

  it('renders no-data state when no array data is provided', async () => {
    const { view } = await mountForm({ renderers, schema, uischema });
    const text = view.container.textContent ?? '';

    expect(text.includes('No data')).toBe(true);
    const buttons = Array.from(view.container.querySelectorAll<HTMLButtonElement>('button'));
    expect(buttons.length).toBeGreaterThan(0);
    const addButton = buttons[0];
    expect(addButton.disabled).toBe(false);
  });

  it('uses the scoped array default for the outer panel and lets local false override it', async () => {
    const config = { jsonformsExtended: { collapsible: true, array: { collapsed: true } } };
    const { view, onchange } = await mountForm({
      renderers,
      schema,
      uischema,
      config,
      data: { items: [{ name: 'Ada' }] },
    });
    const toggle = getBySelector<HTMLButtonElement>(view.container, '[data-array-panel-toggle]');
    const content = document.getElementById(toggle.getAttribute('aria-controls')!);
    const changeCount = onchange.mock.calls.length;
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(content?.hidden).toBe(true);
    toggle.click();
    await expect.poll(() => content?.hidden).toBe(false);
    expect(onchange.mock.calls.length).toBe(changeCount);
    await cleanup();

    const local = await mountForm({
      renderers,
      schema,
      uischema: { ...uischema, options: { ...uischema.options, collapsed: false } },
      config,
      data: { items: [{ name: 'Ada' }] },
    });
    const localToggle = getBySelector<HTMLButtonElement>(
      local.view.container,
      '[data-array-panel-toggle]',
    );
    expect(localToggle.getAttribute('aria-expanded')).toBe('true');
    expect(document.getElementById(localToggle.getAttribute('aria-controls')!)?.hidden).toBe(false);
  });

  it.each([
    { local: false, config: true, toggle: false },
    { local: true, config: false, toggle: true },
  ])(
    'lets local collapsible=$local override the shared $config default',
    async ({ local, config, toggle }) => {
      const { view } = await mountForm({
        renderers,
        schema,
        uischema: {
          ...uischema,
          options: { ...uischema.options, collapsible: local, collapsed: true },
        },
        config: { jsonformsExtended: { collapsible: config } },
        data: { items: [{ name: 'Ada' }] },
      });
      const panelToggle = view.container.querySelector<HTMLButtonElement>(
        '[data-array-panel-toggle]',
      );
      expect(Boolean(panelToggle)).toBe(toggle);
      if (panelToggle) {
        expect(panelToggle.getAttribute('aria-expanded')).toBe('false');
        expect(document.getElementById(panelToggle.getAttribute('aria-controls')!)?.hidden).toBe(
          true,
        );
      } else {
        expect(view.container.textContent).toContain('Ada');
      }
    },
  );

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
    const before = onchange.mock.calls.length;
    addButton.dispatchEvent(new Event('click', { bubbles: true }));
    const changeEvent = await waitForFormChange(onchange, before);

    expect(Array.isArray(changeEvent.data.items)).toBe(true);
    expect((changeEvent.data.items as unknown[]).length).toBe(1);

    const input = getBySelector<HTMLInputElement>(view.container, 'input[type="text"]');
    expect(input.value).toBe('');
  });

  it.each([
    { name: 'default', config: {}, local: undefined, expanded: true },
    { name: 'flat true', config: { collapseNewItems: true }, local: undefined, expanded: false },
    { name: 'local false', config: { collapseNewItems: true }, local: false, expanded: true },
    { name: 'local true', config: { collapseNewItems: false }, local: true, expanded: false },
  ])('applies $name collapseNewItems to the new item', async ({ config, local, expanded }) => {
    const { view, onchange } = await mountForm({
      renderers,
      schema,
      uischema: {
        ...uischema,
        options: {
          ...uischema.options,
          ...(local === undefined ? {} : { collapseNewItems: local }),
        },
      },
      config,
      data: { items: [] },
    });
    const add = [...view.container.querySelectorAll<HTMLButtonElement>('button')].find((button) =>
      button.getAttribute('aria-label')?.toLowerCase().includes('add'),
    )!;
    const before = onchange.mock.calls.length;
    add.click();
    await waitForFormChange(onchange, before);
    await expect
      .poll(() =>
        view.container
          .querySelector('button[aria-expanded]:not([aria-haspopup])')
          ?.getAttribute('aria-expanded'),
      )
      .toBe(String(expanded));
  });

  it('keeps the existing item open when a newly added item is collapsed', async () => {
    const { view, onchange } = await mountForm({
      renderers,
      schema,
      uischema,
      config: { collapseNewItems: true },
      data: { items: [{ name: 'Ada' }] },
    });
    const triggers = () => [
      ...view.container.querySelectorAll<HTMLButtonElement>(
        'button[aria-expanded]:not([aria-haspopup])',
      ),
    ];
    expect(triggers()[0]?.getAttribute('aria-expanded')).toBe('true');
    const add = [...view.container.querySelectorAll<HTMLButtonElement>('button')].find((button) =>
      button.getAttribute('aria-label')?.toLowerCase().includes('add'),
    )!;
    const before = onchange.mock.calls.length;
    add.click();
    await waitForFormChange(onchange, before);
    await expect
      .poll(() => triggers().map((trigger) => trigger.getAttribute('aria-expanded')))
      .toEqual(['true', 'false']);
  });

  it('lets the user open an item after the initial collapsed setting', async () => {
    const { view } = await mountForm({
      renderers,
      schema,
      uischema,
      config: { jsonformsExtended: { array: { collapsed: true } } },
      data: { items: [{ name: 'Ada' }, { name: 'Grace' }] },
    });
    const triggers = () => [
      ...view.container.querySelectorAll<HTMLButtonElement>(
        'button[aria-expanded]:not([aria-haspopup])',
      ),
    ];
    expect(triggers().map((trigger) => trigger.getAttribute('aria-expanded'))).toEqual([
      'false',
      'false',
    ]);
    triggers()[1]!.click();
    await expect.poll(() => triggers()[1]?.getAttribute('aria-expanded')).toBe('true');
    await view.rerender({ i18n: { locale: 'bg' } });
    await expect.poll(() => triggers()[1]?.getAttribute('aria-expanded')).toBe('true');
  });

  it('closes expansion when the open item is removed', async () => {
    const { view, onchange } = await mountForm({
      renderers,
      schema,
      uischema: {
        ...uischema,
        options: { ...uischema.options, confirmation: { delete: 'never' } },
      },
      data: { items: [{ name: 'Ada' }, { name: 'Grace' }] },
    });
    const triggers = () => [
      ...view.container.querySelectorAll<HTMLButtonElement>(
        'button[aria-expanded]:not([aria-haspopup])',
      ),
    ];
    expect(triggers()[0]?.getAttribute('aria-expanded')).toBe('true');
    const firstRemove = view.container.querySelector<HTMLButtonElement>(
      'button[aria-label^="Delete"]',
    );
    expect(firstRemove).not.toBeNull();
    const before = onchange.mock.calls.length;
    firstRemove!.click();
    expect((await waitForFormChange(onchange, before)).data.items).toEqual([{ name: 'Grace' }]);
    await expect.poll(() => triggers()[0]?.getAttribute('aria-expanded')).toBe('false');
  });

  it('keeps the same item expanded when an earlier item is removed', async () => {
    const { view, onchange } = await mountForm({
      renderers,
      schema,
      uischema: {
        ...uischema,
        options: { ...uischema.options, confirmation: { delete: 'never' } },
      },
      data: { items: [{ name: 'Ada' }, { name: 'Grace' }, { name: 'Lin' }] },
    });
    const triggers = () => [
      ...view.container.querySelectorAll<HTMLButtonElement>(
        'button[aria-expanded]:not([aria-haspopup])',
      ),
    ];
    triggers()[1]!.click();
    await expect.poll(() => triggers()[1]?.getAttribute('aria-expanded')).toBe('true');
    const firstRemove = view.container.querySelector<HTMLButtonElement>(
      'button[aria-label^="Delete"]',
    );
    expect(firstRemove).not.toBeNull();
    const before = onchange.mock.calls.length;
    firstRemove!.click();
    expect((await waitForFormChange(onchange, before)).data.items).toEqual([
      { name: 'Grace' },
      { name: 'Lin' },
    ]);
    await expect
      .poll(() => triggers().map((trigger) => trigger.getAttribute('aria-expanded')))
      .toEqual(['true', 'false']);
  });

  it.each([
    {
      name: 'global childLabelProp',
      config: { childLabelProp: 'alias' },
      local: {},
      expected: 'Ada',
    },
    {
      name: 'global elementLabelProp',
      config: { elementLabelProp: 'alias' },
      local: {},
      expected: 'Ada',
    },
    {
      name: 'local childLabelProp',
      config: {},
      local: { childLabelProp: 'alias' },
      expected: 'Grace',
    },
    {
      name: 'local elementLabelProp',
      config: {},
      local: { elementLabelProp: 'alias' },
      expected: 'Grace',
    },
    {
      name: 'local elementLabelProp over childLabelProp',
      config: {},
      local: { childLabelProp: 'alias', elementLabelProp: 'name' },
      expected: 'Ada',
    },
  ])('uses $name only at the array control', async ({ config, local, expected }) => {
    const { view } = await mountForm({
      renderers,
      schema,
      uischema: { ...uischema, options: { ...uischema.options, ...local } },
      config,
      data: { items: [{ name: 'Ada', alias: 'Grace' }] },
    });
    const header = view.container.querySelector<HTMLButtonElement>(
      'button[aria-expanded]:not([aria-haspopup])',
    );
    expect(header?.textContent).toContain(expected);
  });

  it('renders validation error for invalid nested item data', async () => {
    const { view } = await mountForm({
      renderers,
      schema,
      uischema,
      data: { items: [{ name: 'A' }] },
    });

    expectValidationError(view.container);
  });

  it('uses elementLabelProp for array item headers', async () => {
    const customLabelSchema = {
      ...schema,
      properties: {
        items: {
          type: 'array',
          title: 'Items',
          items: {
            type: 'object',
            properties: {
              message1: { type: 'string' },
              message2: { type: 'string' },
            },
          },
        },
      },
    } as JsonSchema;
    const customLabelUiSchema = {
      ...uischema,
      options: { ...uischema.options, elementLabelProp: 'message2' },
    } as UISchemaElement;

    const { view } = await mountForm({
      renderers,
      schema: customLabelSchema,
      uischema: customLabelUiSchema,
      data: { items: [{ message1: 'Message one', message2: 'Message two' }] },
    });

    const itemHeader = view.container.querySelector<HTMLElement>('.truncate.text-sm.font-medium');
    expect(itemHeader?.textContent?.trim()).toBe('Message two');
  });
  it('uses catalog array actions and lets host translations override them', async () => {
    const renderers = [arrayLayoutRendererEntry, layoutRendererEntry, stringControlRendererEntry];
    const { view } = await mountForm({
      renderers,
      schema: {
        type: 'array',
        items: { type: 'object', properties: { name: { type: 'string' } } },
      },
      uischema: { type: 'Control', scope: '#', label: 'Records', options: { detail: 'GENERATE' } },
      data: [],
      i18n: { locale: 'bg' },
    });
    expect(
      view.container.querySelector('button[aria-label="Бутон за добавяне към Records"]'),
    ).not.toBeNull();
    expect(view.container.textContent).toContain('Няма данни');
    await view.rerender({
      i18n: {
        locale: 'fr',
        translate: (key: string, fallback?: string) =>
          key === 'array.addAriaLabelWithLabel' ? 'Ajouter à {label}' : (fallback ?? key),
      },
    });
    expect(view.container.querySelector('button[aria-label="Ajouter à Records"]')).not.toBeNull();
  });
});
