import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { RuleEffect, type UISchemaElement } from '@jsonforms/core';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import { shadcnRenderers } from '../../src/lib/renderers';

afterEach(cleanup);
const label = (text: string, layout = {}) => ({ type: 'Label', text, options: { layout } });
const mount = async (type: string, elements: unknown[], options = {}, config = {}) => {
  const view = await render(JsonForms, {
    props: {
      data: {},
      schema: { type: 'object' },
      renderers: shadcnRenderers,
      config,
      uischema: { type, elements, options } as UISchemaElement,
    },
  });
  view.container.style.width = '640px';
  return view;
};

it.each(['HorizontalLayout', 'VerticalLayout', 'Group'])(
  'applies local container alignment, spacing, and wrap for %s',
  async (type) => {
    const view = await mount(
      type,
      [label('First'), label('Second')],
      { align: 'center', justify: 'end', gap: 0, wrap: false },
      { jsonformsExtended: { layoutDefaults: { gap: 24, wrap: true } } },
    );
    const root = view.container.querySelector<HTMLElement>('[data-layout]')!;
    expect(getComputedStyle(root).alignItems).toBe('center');
    expect(getComputedStyle(root).justifyContent).toBe('flex-end');
    expect(getComputedStyle(root).gap).toBe('0px');
    expect(getComputedStyle(root).flexWrap).toBe('nowrap');
  },
);

it('uses local horizontal gridColumns and minItemWidth over configured defaults', async () => {
  const elements = [label('First', { span: 2 }), label('Second', { span: 2 })];
  const view = await mount(
    'HorizontalLayout',
    elements,
    { gridColumns: 4, gap: 0, minItemWidth: 200 },
    { jsonformsExtended: { layoutDefaults: { gridColumns: 8, minItemWidth: 300 } } },
  );
  const first = view.container.querySelector<HTMLElement>('[data-layout-item]')!;
  expect(first.getBoundingClientRect().width).toBeCloseTo(320, 0);
  expect(getComputedStyle(first).minWidth).toBe('200px');
  await view.rerender({
    uischema: {
      type: 'HorizontalLayout',
      options: { gridColumns: 8, gap: 0, minItemWidth: 0 },
      elements,
    } as UISchemaElement,
  });
  expect(first.getBoundingClientRect().width).toBeCloseTo(160, 0);
  expect(getComputedStyle(first).minWidth).toBe('0px');
});

it('ignores an old global minimum and accepts a live Svelte vendor setting', async () => {
  const view = await mount(
    'HorizontalLayout',
    [label('First')],
    {},
    { jsonformsExtended: { layoutDefaults: { minItemWidth: 180 } } },
  );
  const item = view.container.querySelector<HTMLElement>('[data-layout-item]')!;
  expect(getComputedStyle(item).minWidth).toBe('0px');
  await view.rerender({
    config: { jsonformsSvelte: { layoutDefaults: { minItemWidth: 220 } } },
  });
  await vi.waitFor(() => expect(getComputedStyle(item).minWidth).toBe('220px'));
});

it('reports conflicting valid sizing modes to the author while keeping fixed precedence', async () => {
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  try {
    const view = await mount(
      'HorizontalLayout',
      [label('Fixed', { width: 120, span: 2, weight: 3 })],
      {
        gridColumns: 4,
        gap: 0,
      },
    );
    const item = view.container.querySelector<HTMLElement>('[data-layout-item]')!;
    expect(item.getBoundingClientRect().width).toBeCloseTo(120, 0);
    expect(item.getAttribute('data-layout-diagnostic')).toContain('Multiple sizing modes');
    expect(warning).toHaveBeenCalledWith('layout.multipleSizingModes', {
      severity: 'warning',
      message: 'Multiple sizing modes (fixed, span, weight); using fixed.',
      path: '',
      index: 0,
    });
  } finally {
    warning.mockRestore();
  }
});

it('reports an invalid local grid size while using the configured fallback', async () => {
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  try {
    const view = await mount(
      'HorizontalLayout',
      [label('Spanned', { span: 2 })],
      { gridColumns: 0, gap: 0, minItemWidth: -1 },
      {
        jsonformsExtended: { layoutDefaults: { gridColumns: 4 } },
        jsonformsSvelte: { layoutDefaults: { minItemWidth: 220 } },
      },
    );
    const item = view.container.querySelector<HTMLElement>('[data-layout-item]')!;
    expect(item.getBoundingClientRect().width).toBeCloseTo(320, 0);
    expect(
      view.container
        .querySelector('[data-layout-container-diagnostic]')
        ?.getAttribute('data-layout-container-diagnostic'),
    ).toContain('options.gridColumns');
    expect(warning).toHaveBeenCalledWith('layout.invalidOption', {
      severity: 'warning',
      message: 'options.gridColumns must be a positive integer; ignored.',
      path: '',
      index: -1,
    });
    expect(warning).toHaveBeenCalledWith('layout.invalidOption', {
      severity: 'warning',
      message: 'options.minItemWidth must be a non-negative dimension; ignored.',
      path: '',
      index: -1,
    });
  } finally {
    warning.mockRestore();
  }
});

it('keeps Group a vertical section when grid and resizable hints are present', async () => {
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const view = await mount('Group', [label('First', { span: 2 }), label('Second')], {
    gridColumns: 4,
    resizable: true,
  });
  expect(view.container.querySelector('[data-split-layout]')).toBeNull();
  expect(view.container.querySelector('[role="separator"]')).toBeNull();
  expect(view.container.querySelector('[data-layout="column"]')).not.toBeNull();
  expect(
    view.container
      .querySelector('[data-layout-diagnostic]')
      ?.getAttribute('data-layout-diagnostic'),
  ).toContain('vertical layout');
  expect(warning).toHaveBeenCalledWith('layout.unsupportedOption', {
    severity: 'warning',
    message: 'options.resizable has no effect outside a split layout; ignored.',
    path: '',
    index: -1,
  });
  warning.mockRestore();
});

it('applies child layout dimensions and constraints to a bound Control', async () => {
  const view = await render(JsonForms, {
    props: {
      data: { name: 'Ada' },
      schema: { type: 'object', properties: { name: { type: 'string' } } },
      renderers: shadcnRenderers,
      uischema: {
        type: 'HorizontalLayout',
        elements: [
          {
            type: 'Control',
            scope: '#/properties/name',
            options: {
              layout: {
                width: 120,
                height: 80,
                span: 4,
                weight: 3,
                minWidth: 0,
                maxWidth: 160,
                minHeight: 40,
                maxHeight: 100,
              },
            },
          },
        ],
      } as UISchemaElement,
    },
  });
  const item = view.container.querySelector<HTMLElement>('[data-layout-item]')!;
  expect(view.container.querySelector('input')).not.toBeNull();
  expect(item.style.flex).toBe('0 0 120px');
  expect(item.getBoundingClientRect().width).toBeCloseTo(120, 0);
  expect(item.getBoundingClientRect().height).toBeCloseTo(80, 0);
  expect(getComputedStyle(item).minWidth).toBe('0px');
  expect(getComputedStyle(item).maxWidth).toBe('160px');
  expect(getComputedStyle(item).minHeight).toBe('40px');
  expect(getComputedStyle(item).maxHeight).toBe('100px');
});

it('uses portable defaults and applies explicit zero gap and false wrap', async () => {
  const view = await mount('HorizontalLayout', [label('First'), label('Second')]);
  const root = view.container.querySelector<HTMLElement>('[data-layout]')!;
  expect(getComputedStyle(root).gap).toBe('16px');
  expect(getComputedStyle(root).flexWrap).toBe('nowrap');
  await view.rerender({
    config: { jsonformsExtended: { layoutDefaults: { gap: 24, wrap: true } } },
    uischema: {
      type: 'HorizontalLayout',
      options: { gap: 0, wrap: false },
      elements: [label('First'), label('Second')],
    } as UISchemaElement,
  });
  expect(getComputedStyle(root).gap).toBe('0px');
  expect(getComputedStyle(root).flexWrap).toBe('nowrap');
});
it('reserves fixed and span widths before distributing remaining width by weight', async () => {
  const view = await mount(
    'HorizontalLayout',
    [
      label('Fixed', { width: 120, span: 8 }),
      label('Span', { span: 4 }),
      label('Weight', { weight: 2 }),
    ],
    { gap: 16 },
  );
  const items = Array.from(view.container.querySelectorAll<HTMLElement>('[data-layout-item]'));
  expect(items[0].getBoundingClientRect().width).toBeCloseTo(120, 0);
  expect(items[1].getBoundingClientRect().width).toBeCloseTo(148, 0);
  expect(items[2].getBoundingClientRect().width).toBeCloseTo(340, 0);
});
it('sizes Spacers on the parent main axis and defaults an omitted size to 32', async () => {
  const row = await mount('HorizontalLayout', [{ type: 'Spacer' }, label('After')], { gap: 0 });
  expect(
    row.container.querySelector<HTMLElement>('[data-layout-item]')!.getBoundingClientRect().width,
  ).toBeCloseTo(32, 0);
  const column = await mount('VerticalLayout', [{ type: 'Spacer', size: 48 }, label('After')], {
    gap: 0,
  });
  expect(
    column.container.querySelector<HTMLElement>('[data-layout-item]')!.getBoundingClientRect()
      .height,
  ).toBeCloseTo(48, 0);
});
it('removes hidden slots from vertical spacing', async () => {
  const view = await mount('VerticalLayout', [
    label('First'),
    {
      ...label('Hidden'),
      rule: { effect: RuleEffect.HIDE, condition: { scope: '#', schema: {} } },
    },
    label('Last'),
  ]);
  expect(view.container.querySelectorAll('[data-layout-item]')).toHaveLength(2);
  expect(view.container.textContent).not.toContain('Hidden');
});
it('wraps by the parent minimum width while preserving natural vertical weighted content', async () => {
  const row = await mount('HorizontalLayout', [label('A'), label('B'), label('C')], {
    wrap: true,
    minItemWidth: 240,
  });
  const items = Array.from(row.container.querySelectorAll<HTMLElement>('[data-layout-item]'));
  expect(items[0].getBoundingClientRect().top).toBe(items[1].getBoundingClientRect().top);
  expect(items[2].getBoundingClientRect().top).toBeGreaterThan(
    items[0].getBoundingClientRect().top,
  );
  const column = await mount('VerticalLayout', [label('Natural height', { weight: 2 })]);
  expect(
    column.container.querySelector<HTMLElement>('[data-layout-item]')!.getBoundingClientRect()
      .height,
  ).toBeGreaterThan(0);
});
it('keeps an unsupported vertical span diagnostic on the layout item', async () => {
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  try {
    const view = await mount('VerticalLayout', [label('Text', { span: 4 })]);
    await view.rerender({ i18n: { locale: 'bg' } });
    expect(
      view.container
        .querySelector('[data-layout-diagnostic]')
        ?.getAttribute('data-layout-diagnostic'),
    ).toContain('vertical layout');
    expect(view.container.querySelector('[role="alert"]')).toBeNull();
    expect(warning).toHaveBeenCalledWith('layout.spanUnsupported', {
      severity: 'warning',
      message: '`span` has no effect in a vertical layout; ignored.',
      path: '',
      index: 0,
    });
  } finally {
    warning.mockRestore();
  }
});

it('applies gap and child sizing inside Group without gaps for hidden children', async () => {
  const view = await mount(
    'Group',
    [
      label('First', { height: 40 }),
      {
        ...label('Hidden'),
        rule: { effect: RuleEffect.HIDE, condition: { scope: '#', schema: {} } },
      },
      label('Last'),
    ],
    { gap: 0 },
  );
  const root = view.container.querySelector<HTMLElement>('[data-layout="column"]')!;
  expect(getComputedStyle(root).gap).toBe('0px');
  expect(root.querySelectorAll('[data-layout-item]')).toHaveLength(2);
  expect(
    root.querySelector<HTMLElement>('[data-layout-item]')!.getBoundingClientRect().height,
  ).toBeCloseTo(40, 0);
});
