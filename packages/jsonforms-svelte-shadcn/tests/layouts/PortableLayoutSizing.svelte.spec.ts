import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { RuleEffect, type UISchemaElement } from '@jsonforms/core';
import { afterEach, expect, it } from 'vite-plus/test';
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
it('localizes an unsupported vertical span diagnostic', async () => {
  const view = await mount('VerticalLayout', [label('Text', { span: 4 })]);
  await view.rerender({ i18n: { locale: 'bg' } });
  expect(view.container.querySelector('[data-layout-diagnostic]')?.textContent).toContain(
    'вертикално оформление',
  );
});

it('keeps portable sizing as the registered default and diagnoses legacy hints', async () => {
  const view = await mount('HorizontalLayout', [
    { type: 'Label', text: 'Legacy hint', options: { columns: 4 } },
  ]);
  expect(view.container.querySelector('[data-layout-mode]')?.getAttribute('data-layout-mode')).toBe(
    'portable',
  );
  expect(view.container.querySelector('[data-layout-diagnostic]')?.textContent).toContain(
    'columns',
  );
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
