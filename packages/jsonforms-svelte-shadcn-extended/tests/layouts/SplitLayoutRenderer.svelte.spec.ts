import '../../../jsonforms-svelte-shadcn/tests/test.css';
import { stringControlRendererEntry } from '@chobantonov/jsonforms-svelte-shadcn';
import { clearAllIds, type JsonSchema, type UISchemaElement } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';
import { JsonForms } from '@chobantonov/jsonforms-svelte-extended';
import { tick } from 'svelte';
import { splitLayoutRendererEntry } from '../../src/lib/layouts';
import { expectLabelVisible, mountForm, waitForFormChange } from '../testUtils';

const findSplitPaneContainer = (container: HTMLElement): HTMLDivElement => {
  const candidates = Array.from(
    container.querySelectorAll<HTMLDivElement>('[data-slot="resizable-pane-group"]'),
  );
  const match = candidates.find((candidate) => {
    const inputs = candidate.querySelectorAll('input[type="text"]');
    return inputs.length === 2;
  });

  expect(match).toBeTruthy();
  return match as HTMLDivElement;
};

describe('SplitLayoutRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(() => {
    cleanup();
  });

  const renderers = [splitLayoutRendererEntry, stringControlRendererEntry];

  const schema: JsonSchema = {
    type: 'object',
    properties: {
      firstName: {
        type: 'string',
        title: 'First Name',
      },
      lastName: {
        type: 'string',
        title: 'Last Name',
      },
    },
  };

  const horizontalSplitUischema: UISchemaElement = {
    type: 'HorizontalLayout',
    options: { variant: 'splitter' },
    elements: [
      { type: 'Control', scope: '#/properties/firstName' },
      { type: 'Control', scope: '#/properties/lastName' },
    ],
  };

  const verticalSplitUischema: UISchemaElement = {
    type: 'VerticalLayout',
    options: { variant: 'splitter', height: '24rem' },
    elements: [
      { type: 'Control', scope: '#/properties/firstName' },
      { type: 'Control', scope: '#/properties/lastName' },
    ],
  };

  it('renders horizontal split layout and preserves initial control values', () => {
    const { view } = mountForm({ renderers, schema, uischema: horizontalSplitUischema });

    const inputs = Array.from(
      view.container.querySelectorAll<HTMLInputElement>('input[type="text"]'),
    );
    const splitPane = findSplitPaneContainer(view.container);

    expect(inputs).toHaveLength(2);
    expect(inputs[0].value).toBe('');
    expect(inputs[1].value).toBe('');
    expectLabelVisible(view.container, 'First Name');
    expectLabelVisible(view.container, 'Last Name');
    expect(splitPane.getAttribute('data-direction')).toBe('horizontal');
  });

  it('renders vertical split layout', () => {
    const { view } = mountForm({ renderers, schema, uischema: verticalSplitUischema });

    const inputs = Array.from(
      view.container.querySelectorAll<HTMLInputElement>('input[type="text"]'),
    );
    const splitPane = findSplitPaneContainer(view.container);

    expect(inputs).toHaveLength(2);
    expect(inputs[0].value).toBe('');
    expect(inputs[1].value).toBe('');
    expect(splitPane.getAttribute('data-direction')).toBe('vertical');
  });

  it('updates core data when a nested split-pane control changes', async () => {
    const { view, onchange } = mountForm({
      renderers,
      schema,
      uischema: horizontalSplitUischema,
      data: { firstName: 'Ada', lastName: 'Lovelace' },
    });

    const inputs = Array.from(
      view.container.querySelectorAll<HTMLInputElement>('input[type="text"]'),
    );

    expect(inputs).toHaveLength(2);
    expect(inputs[0].value).toBe('Ada');
    expect(inputs[1].value).toBe('Lovelace');

    const before = onchange.mock.calls.length;
    inputs[1].value = 'Byron';
    inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
    const changeEvent = await waitForFormChange(onchange, before);

    expect(changeEvent.data.lastName).toBe('Byron');
  });

  const widths = (container: HTMLElement) =>
    Array.from(container.querySelectorAll<HTMLElement>('[data-split-pane]')).map(
      (pane) => pane.getBoundingClientRect().width,
    );
  it('uses weighted shares, removes hidden panes and preserves data through visibility changes', async () => {
    const ui = {
      type: 'HorizontalLayout',
      options: { variant: 'splitter' },
      elements: [
        { type: 'Control', scope: '#/properties/firstName', options: { layout: { weight: 2 } } },
        {
          type: 'Control',
          scope: '#/properties/lastName',
          rule: {
            effect: 'SHOW',
            condition: { scope: '#/properties/show', schema: { const: true } },
          },
        },
      ],
    } as UISchemaElement;
    const { view, onchange } = mountForm({
      renderers,
      schema,
      uischema: ui,
      data: { firstName: 'Ada', lastName: 'Lovelace', show: true },
    });
    view.container.style.width = '800px';
    await vi.waitFor(() =>
      expect(widths(view.container)[0] / widths(view.container)[1]).toBeCloseTo(2, 1),
    );
    expect(view.container.querySelectorAll('[role="separator"]')).toHaveLength(1);
    await view.rerender({ data: { firstName: 'Ada', lastName: 'Lovelace', show: false } });
    await vi.waitFor(() =>
      expect(view.container.querySelectorAll('[data-split-pane]')).toHaveLength(1),
    );
    expect(view.container.querySelectorAll('[role="separator"]')).toHaveLength(0);
    await view.rerender({ data: { firstName: 'Ada', lastName: 'Lovelace', show: true } });
    await vi.waitFor(() =>
      expect(widths(view.container)[0] / widths(view.container)[1]).toBeCloseTo(2, 1),
    );
    expect(onchange.mock.lastCall?.[0].data.lastName).toBe('Lovelace');
  });
  it('keeps disabled boundaries visible and nonfocusable, then restores keyboard resizing', async () => {
    const ui = { ...horizontalSplitUischema, options: { variant: 'splitter', resizable: false } };
    const { view } = mountForm({
      renderers,
      schema,
      uischema: ui,
      data: { firstName: 'Ada', lastName: 'Lovelace' },
    });
    view.container.style.width = '800px';
    await vi.waitFor(() =>
      expect(view.container.querySelector<HTMLElement>('[role="separator"]')?.tabIndex).toBe(-1),
    );
    const handle = view.container.querySelector<HTMLElement>('[role="separator"]')!;
    // Let native ResizeObserver constraints settle before sending one key.
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    const before = widths(view.container);
    handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await tick();
    expect(widths(view.container)).toEqual(before);
    await view.rerender({ uischema: horizontalSplitUischema });
    await vi.waitFor(() => expect(handle.tabIndex).toBe(0));
    await tick();
    handle.focus();
    handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await tick();
    await vi.waitFor(() => expect(widths(view.container)[0]).toBeGreaterThan(before[0]));
  });
  it('resolves global dimensions and local overrides without remounting pane controls', async () => {
    const view = render(JsonForms, {
      schema,
      renderers,
      data: { firstName: 'Ada', lastName: 'Lovelace' },
      uischema: verticalSplitUischema,
      config: { height: '32rem', minHeight: '12rem' },
    });
    const root = view.container.querySelector<HTMLElement>('[data-split-layout]')!;
    const input = view.container.querySelector('input')!;
    expect(root.style.height).toBe('24rem');
    expect(root.style.minHeight).toBe('12rem');
    await view.rerender({
      uischema: { ...verticalSplitUischema, options: { variant: 'splitter' } },
    });
    await vi.waitFor(() => expect(root.style.height).toBe('32rem'));
    await view.rerender({ config: { height: 480, minHeight: 0 } });
    await vi.waitFor(() => expect(root.style.height).toBe('480px'));
    expect(root.style.minHeight).toBe('0px');
    expect(view.container.querySelector('input')).toBe(input);
    expect(input.value).toBe('Ada');
  });

  it('uses a definite vertical fallback and localizes unsupported-wrap feedback', async () => {
    const view = render(JsonForms, {
      props: {
        renderers,
        schema,
        uischema: { ...verticalSplitUischema, options: { variant: 'splitter', wrap: true } },
        i18n: { locale: 'bg' },
      },
    });
    const root = view.container.querySelector<HTMLElement>('[data-split-layout]')!;
    expect(root.style.height).toBe('20rem');
    expect(view.container.querySelector('[data-layout-diagnostic]')?.textContent).toContain(
      'Пренасянето',
    );
    await vi.waitFor(() =>
      expect(view.container.querySelector('[role="separator"]')?.getAttribute('aria-label')).toBe(
        'Промяна на размера на панелите',
      ),
    );
  });
  it.each(['horizontal', 'vertical'] as const)(
    'honors fixed %s sizes, drag limits and runtime state',
    async (direction) => {
      const vertical = direction === 'vertical';
      const axis = vertical ? 'height' : 'width';
      const uischema = {
        type: vertical ? 'VerticalLayout' : 'HorizontalLayout',
        options: { variant: 'splitter', height: 400 },
        elements: [
          {
            type: 'Control',
            scope: '#/properties/firstName',
            options: {
              layout: {
                [axis]: '120px',
                [vertical ? 'minHeight' : 'minWidth']: 80,
                [vertical ? 'maxHeight' : 'maxWidth']: '160px',
                weight: 99,
                span: 8,
              },
            },
          },
          { type: 'Control', scope: '#/properties/lastName', options: { layout: { weight: 1 } } },
        ],
      } as UISchemaElement;
      const view = render(JsonForms, {
        props: { schema, uischema, renderers, data: { firstName: 'Ada', lastName: 'Lovelace' } },
      });
      view.container.style.width = '400px';
      const root = view.container.querySelector<HTMLElement>('[data-split-layout]')!;
      const input = root.querySelector('input')!;
      const firstSize = () =>
        root.querySelector('[data-split-pane]')!.getBoundingClientRect()[axis];
      await vi.waitFor(() => expect(firstSize()).toBeCloseTo(120, 0));
      const handle = root.querySelector<HTMLElement>('[role="separator"]')!;
      for (let i = 0; i < 30; i++)
        handle.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: vertical ? 'ArrowDown' : 'ArrowRight',
            bubbles: true,
          }),
        );
      await vi.waitFor(() => expect(firstSize()).toBeCloseTo(160, 0));
      await view.rerender({ data: { firstName: 'Grace', lastName: 'Hopper' } });
      await vi.waitFor(() => expect(input.value).toBe('Grace'));
      expect(root.querySelector('input')).toBe(input);
      expect(firstSize()).toBeCloseTo(160, 0);
      for (let i = 0; i < 30; i++)
        handle.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: vertical ? 'ArrowUp' : 'ArrowLeft',
            bubbles: true,
          }),
        );
      await vi.waitFor(() => expect(firstSize()).toBeCloseTo(80, 0));
      view.container.style.width = '520px';
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
      expect(root.querySelector('input')).toBe(input);
      expect(firstSize()).toBeGreaterThanOrEqual(79);
      expect(firstSize()).toBeLessThanOrEqual(161);
    },
  );

  it('keeps vertical Auto at content height and measures percentage fixed dimensions', async () => {
    const view = render(JsonForms, {
      props: {
        schema,
        renderers,
        uischema: {
          type: 'VerticalLayout',
          options: { variant: 'splitter', height: 400 },
          elements: [
            {
              type: 'Control',
              scope: '#/properties/firstName',
              options: { layout: { height: '25%' } },
            },
            { type: 'Control', scope: '#/properties/lastName' },
          ],
        } as UISchemaElement,
        data: { firstName: 'Ada', lastName: 'Lovelace' },
      },
    });
    const root = view.container.querySelector<HTMLElement>('[data-split-layout]')!;
    const panes = () => Array.from(root.querySelectorAll<HTMLElement>('[data-split-pane]'));
    await vi.waitFor(() => expect(panes()[0].getBoundingClientRect().height).toBeCloseTo(100, 0));
    expect(panes()[1].getBoundingClientRect().height).toBeGreaterThan(20);
    expect(panes()[1].getBoundingClientRect().height).toBeLessThan(150);
  });
  it('applies fixed cross sizes, alignment and justification without remounting controls', async () => {
    const elements = [
      {
        type: 'Control',
        scope: '#/properties/firstName',
        options: { layout: { width: 80, height: 60 } },
      },
      {
        type: 'Control',
        scope: '#/properties/lastName',
        options: { layout: { width: 80, height: 40 } },
      },
    ];
    const make = (gap: number, align: string, justify: string) =>
      ({
        type: 'HorizontalLayout',
        options: { variant: 'splitter', height: 200, gap, align, justify },
        elements,
      }) as UISchemaElement;
    const view = render(JsonForms, {
      props: { schema, renderers, uischema: make(20, 'end', 'space-between'), data: {} },
    });
    view.container.style.width = '400px';
    const root = view.container.querySelector<HTMLElement>('[data-split-layout]')!;
    const content = () => Array.from(root.querySelectorAll('[data-split-pane]'));
    const first = root.querySelector('input');
    await vi.waitFor(() => expect(content()[0].getBoundingClientRect().width).toBeCloseTo(80, 0));
    expect(content()[0].getBoundingClientRect().height).toBeCloseTo(60, 0);
    expect(content()[0].getBoundingClientRect().bottom).toBeCloseTo(
      root.getBoundingClientRect().bottom,
      0,
    );
    expect(content()[1].getBoundingClientRect().right).toBeCloseTo(
      root.getBoundingClientRect().right,
      0,
    );
    await view.rerender({ uischema: make(0, 'start', 'start') });
    await vi.waitFor(() =>
      expect(content()[0].getBoundingClientRect().top).toBeCloseTo(
        root.getBoundingClientRect().top,
        0,
      ),
    );
    expect(
      content()[1].getBoundingClientRect().right - root.getBoundingClientRect().left,
    ).toBeLessThan(180);
    expect(root.querySelector('input')).toBe(first);
  });

  it('resolves CSS calc dimensions and the parent minimum with child override precedence', async () => {
    const view = render(JsonForms, {
      props: {
        schema,
        renderers,
        data: {},
        uischema: {
          type: 'HorizontalLayout',
          options: { variant: 'splitter', gap: 0, minItemWidth: 120 },
          elements: [
            {
              type: 'Control',
              scope: '#/properties/firstName',
              options: { layout: { width: 'calc(50% - 10px)', minWidth: 0 } },
            },
            { type: 'Control', scope: '#/properties/lastName' },
          ],
        } as UISchemaElement,
      },
    });
    view.container.style.width = '180px';
    const root = view.container.querySelector<HTMLElement>('[data-split-layout]')!;
    const widths = () =>
      Array.from(root.querySelectorAll('[data-split-pane]')).map(
        (node) => node.getBoundingClientRect().width,
      );
    await vi.waitFor(() => expect(widths()[0]).toBeCloseTo(80, 0));
    expect(widths()[1]).toBeCloseTo(120, 0);
  });
});
