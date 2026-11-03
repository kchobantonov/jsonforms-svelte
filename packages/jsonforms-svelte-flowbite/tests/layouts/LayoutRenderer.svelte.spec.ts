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

  it('delivers invalid gridColumns only while the authored option is active', async () => {
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

  it('reports a clamped child span again after a valid layout interval', async () => {
    const ondiagnostic = vi.fn();
    const ui = (span: number) =>
      ({
        type: 'HorizontalLayout',
        options: { gridColumns: 4 },
        elements: [
          {
            type: 'Control',
            scope: '#/properties/firstName',
            options: { layout: { span } },
          },
        ],
      }) as UISchemaElement;
    const { view, onchange } = await mountForm({
      renderers,
      schema,
      uischema: ui(8),
      ondiagnostic,
    });
    const warnings = () =>
      ondiagnostic.mock.calls
        .map(([diagnostic]) => diagnostic)
        .filter((diagnostic) => diagnostic.code === 'layout.spanClamped');
    await vi.waitFor(() => expect(warnings()).toHaveLength(1));
    expect(warnings()[0]).toMatchObject({
      severity: 'warning',
      details: { path: '', index: 0 },
    });
    await view.rerender({ data: { firstName: 'Ada' } });
    expect(warnings()).toHaveLength(1);
    const changes = onchange.mock.calls.length;
    await view.rerender({ uischema: ui(4) });
    await view.rerender({ uischema: ui(8) });
    await vi.waitFor(() => expect(warnings()).toHaveLength(2));
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
