import '../test.css';
import { clearAllIds, type JsonSchema, type UISchemaElement } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import { entry as stringControlRendererEntry } from '../../src/lib/controls/StringControlRenderer.entry';
import { entry as layoutRendererEntry } from '../../src/lib/layouts/LayoutRenderer.entry';
import { expectLabelVisible, mountForm, waitForFormChange } from '../testUtils';

const findLayoutContainer = (
  container: HTMLElement,
  direction: 'row' | 'column',
): HTMLDivElement => {
  const candidates = Array.from(
    container.querySelectorAll<HTMLDivElement>(`div[data-layout="${direction}"]`),
  );
  const match = candidates.find((candidate) => {
    const layoutItems = Array.from(candidate.children) as HTMLElement[];
    return (
      layoutItems.length === 2 &&
      layoutItems.every((item) => item.querySelector('input[type="text"]') !== null)
    );
  });

  expect(match).toBeTruthy();
  return match as HTMLDivElement;
};

describe('LayoutRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(async () => {
    await cleanup();
  });

  const renderers = [layoutRendererEntry, stringControlRendererEntry];
  const schema = {
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
  } as JsonSchema;

  it('reserves TemplateLayout for its extended renderer and diagnostics', () => {
    expect(
      layoutRendererEntry.tester(
        { type: 'TemplateLayout', elements: [] } as UISchemaElement,
        schema,
        { rootSchema: schema, config: {} },
      ),
    ).toBe(-1);
  });

  const verticalUischema: UISchemaElement = {
    type: 'VerticalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/firstName' },
      { type: 'Control', scope: '#/properties/lastName' },
    ],
  };

  const horizontalUischema: UISchemaElement = {
    type: 'HorizontalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/firstName' },
      { type: 'Control', scope: '#/properties/lastName' },
    ],
  };

  it('reports typed item codes while preserving inspection messages', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const { view } = await mountForm({
        renderers,
        schema,
        uischema: {
          type: 'HorizontalLayout',
          options: { gridColumns: 4 },
          elements: [
            {
              type: 'Control',
              scope: '#/properties/firstName',
              options: { layout: { span: 8, weight: -1 } },
            },
          ],
        },
      });
      await new Promise(requestAnimationFrame);
      const codes = warn.mock.calls.map(([code]) => code);
      expect(codes).toContain('layout.spanClamped');
      expect(codes).toContain('layout.invalidOption');
      expect(view.container.querySelector('[data-layout-diagnostic]')).toBeTruthy();
    } finally {
      warn.mockRestore();
    }
  });

  it('reports a layout warning again after its authored option is corrected and reintroduced', async () => {
    const ondiagnostic = vi.fn();
    const control = (span: number) => ({
      type: 'Control',
      scope: '#/properties/firstName',
      options: { layout: { span } },
    });
    const ui = (span: number) =>
      ({
        type: 'HorizontalLayout',
        options: { gridColumns: 4 },
        elements: [control(span)],
      }) as UISchemaElement;
    const { view, onchange } = await mountForm({
      renderers,
      schema,
      uischema: ui(8),
      ondiagnostic,
    });
    const count = () =>
      ondiagnostic.mock.calls.filter(([diagnostic]) => diagnostic.code === 'layout.spanClamped')
        .length;
    await vi.waitFor(() => expect(count()).toBe(1));
    await view.rerender({ data: { firstName: 'Ada' } });
    expect(count()).toBe(1);
    const changes = onchange.mock.calls.length;
    await view.rerender({ uischema: ui(2) });
    await view.rerender({ uischema: ui(8) });
    await vi.waitFor(() => expect(count()).toBe(2));
    expect(onchange.mock.calls.length).toBe(changes);
  });

  it('delivers invalid container options to the form callback only while active', async () => {
    const ondiagnostic = vi.fn();
    const ui = (gridColumns: number) =>
      ({
        type: 'HorizontalLayout',
        options: { gridColumns },
        elements: [{ type: 'Control', scope: '#/properties/firstName' }],
      }) as UISchemaElement;
    const { view, onchange } = await mountForm({
      renderers,
      schema,
      uischema: ui(0),
      ondiagnostic,
    });
    const warnings = () =>
      ondiagnostic.mock.calls.filter(
        ([diagnostic]) =>
          diagnostic.code === 'layout.invalidOption' &&
          diagnostic.message.includes('options.gridColumns'),
      );
    await vi.waitFor(() => expect(warnings()).toHaveLength(1));
    expect(warnings()[0]?.[0]).toMatchObject({
      severity: 'warning',
      details: { path: '', index: -1 },
    });
    await view.rerender({ data: { firstName: 'Ada' } });
    expect(warnings()).toHaveLength(1);
    const changes = onchange.mock.calls.length;
    await view.rerender({ uischema: ui(4) });
    await view.rerender({ uischema: ui(0) });
    await vi.waitFor(() => expect(warnings()).toHaveLength(2));
    expect(onchange.mock.calls.length).toBe(changes);
  });

  it('reports invalid common container options through active author intervals', async () => {
    const ondiagnostic = vi.fn();
    const ui = (valid: boolean) =>
      ({
        type: 'HorizontalLayout',
        options: valid
          ? { gap: 2, wrap: false, align: 'start', justify: 'start' }
          : { gap: -2, wrap: 'yes', align: 'middle', justify: 'unknown' },
        elements: [{ type: 'Control', scope: '#/properties/firstName' }],
      }) as UISchemaElement;
    const { view, onchange } = await mountForm({
      renderers,
      schema,
      uischema: ui(false),
      ondiagnostic,
    });
    const warnings = () =>
      ondiagnostic.mock.calls
        .map(([diagnostic]) => diagnostic)
        .filter((diagnostic) => diagnostic.code === 'layout.invalidOption');
    await vi.waitFor(() => expect(warnings()).toHaveLength(4));
    expect(warnings().map(({ message }) => message)).toEqual([
      'options.gap must be a non-negative dimension; ignored.',
      'options.wrap must be a boolean; ignored.',
      'options.align must be a supported alignment; ignored.',
      'options.justify must be a supported justification; ignored.',
    ]);
    expect(
      warnings().every(
        ({ severity, details }) =>
          severity === 'warning' && details.path === '' && details.index === -1,
      ),
    ).toBe(true);
    expect(view.container.querySelector('[role="alert"]')).toBeNull();
    await view.rerender({ data: { firstName: 'Ada' } });
    expect(warnings()).toHaveLength(4);
    const changes = onchange.mock.calls.length;
    await view.rerender({ uischema: ui(true) });
    await vi.waitFor(() =>
      expect(
        view.container.querySelector<HTMLElement>('[data-layout-diagnostic]')?.dataset
          .layoutDiagnostic,
      ).toBeUndefined(),
    );
    await view.rerender({ uischema: ui(false) });
    await vi.waitFor(() => expect(warnings()).toHaveLength(8));
    await view.rerender({
      uischema: ui(true),
      config: {
        jsonformsExtended: {
          layoutDefaults: {
            gap: -1,
            wrap: 'yes',
            align: 'middle',
            justify: 'unknown',
            gridColumns: 0,
          },
        },
        jsonformsSvelte: { layoutDefaults: { minItemWidth: -1 } },
      },
    });
    await vi.waitFor(() => expect(warnings()).toHaveLength(14));
    expect(
      warnings()
        .slice(8)
        .map(({ message }) => message),
    ).toEqual([
      'config.jsonformsExtended.layoutDefaults.gap must be a non-negative dimension; ignored.',
      'config.jsonformsExtended.layoutDefaults.wrap must be a boolean; ignored.',
      'config.jsonformsExtended.layoutDefaults.align must be a supported alignment; ignored.',
      'config.jsonformsExtended.layoutDefaults.justify must be a supported justification; ignored.',
      'config.jsonformsExtended.layoutDefaults.gridColumns must be a positive integer; ignored.',
      'config.jsonformsSvelte.layoutDefaults.minItemWidth must be a non-negative dimension; ignored.',
    ]);
    await view.rerender({ config: {} });
    await view.rerender({
      config: {
        jsonformsExtended: {
          layoutDefaults: {
            gap: -1,
            wrap: 'yes',
            align: 'middle',
            justify: 'unknown',
            gridColumns: 0,
          },
        },
        jsonformsSvelte: { layoutDefaults: { minItemWidth: -1 } },
      },
    });
    await vi.waitFor(() => expect(warnings()).toHaveLength(20));
    expect(onchange.mock.calls.length).toBe(changes);
  });

  it('renders vertical layout with controls stacked one under another', async () => {
    const { view } = await mountForm({ renderers, schema, uischema: verticalUischema });
    const inputs = Array.from(
      view.container.querySelectorAll<HTMLInputElement>('input[type="text"]'),
    );
    const layoutContainer = findLayoutContainer(view.container, 'column');

    expect(inputs).toHaveLength(2);
    expect(inputs[0].value).toBe('');
    expect(inputs[1].value).toBe('');
    expectLabelVisible(view.container, 'First Name');
    expectLabelVisible(view.container, 'Last Name');
    expect(getComputedStyle(layoutContainer).flexDirection).toBe('column');

    const layoutItems = Array.from(layoutContainer.children) as HTMLElement[];
    expect(layoutItems).toHaveLength(2);
    expect(layoutItems.every((item) => !item.style.flexBasis.includes('50%'))).toBe(true);
  });

  it('renders horizontal layout with controls on the same row', async () => {
    const { view } = await mountForm({ renderers, schema, uischema: horizontalUischema });
    const inputs = Array.from(
      view.container.querySelectorAll<HTMLInputElement>('input[type="text"]'),
    );
    const layoutContainer = findLayoutContainer(view.container, 'row');

    expect(inputs).toHaveLength(2);
    expect(inputs[0].value).toBe('');
    expect(inputs[1].value).toBe('');
    expect(getComputedStyle(layoutContainer).flexDirection).toBe('row');

    const layoutItems = Array.from(layoutContainer.children) as HTMLElement[];
    expect(layoutItems).toHaveLength(2);
  });

  it('updates core data when a nested control changes', async () => {
    const { view, onchange } = await mountForm({
      renderers,
      schema,
      uischema: verticalUischema,
      data: { firstName: 'Ada', lastName: 'Lovelace' },
    });

    const inputs = Array.from(
      view.container.querySelectorAll<HTMLInputElement>('input[type="text"]'),
    );
    expect(inputs).toHaveLength(2);
    const secondInput = inputs[1];
    expect(secondInput.value).toBe('Lovelace');

    const before = onchange.mock.calls.length;
    secondInput.value = 'Byron';
    secondInput.dispatchEvent(new Event('input', { bubbles: true }));
    const changeEvent = await waitForFormChange(onchange, before);

    expect(changeEvent.data.lastName).toBe('Byron');
  });
});
