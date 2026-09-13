import '../test.css';
import { RuleEffect, clearAllIds, type JsonSchema, type UISchemaElement } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { entry as stringControlRendererEntry } from '../../src/lib/controls/StringControlRenderer.entry';
import { entry as layoutRendererEntry } from '../../src/lib/layouts/LayoutRenderer.entry';
import { expectLabelVisible, mountForm, waitForFormChange } from '../testUtils';

const findLayoutContainer = (
  container: HTMLElement,
  direction: 'row' | 'column',
): HTMLDivElement => {
  const layoutClass = direction === 'row' ? 'flex-row' : 'flex-col';
  const candidates = Array.from(
    container.querySelectorAll<HTMLDivElement>(`div.flex.${layoutClass}`),
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

  afterEach(() => {
    cleanup();
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

  it('renders vertical layout with controls stacked one under another', () => {
    const { view } = mountForm({ renderers, schema, uischema: verticalUischema });
    const inputs = Array.from(
      view.container.querySelectorAll<HTMLInputElement>('input[type="text"]'),
    );
    const layoutContainer = findLayoutContainer(view.container, 'column');

    expect(inputs).toHaveLength(2);
    expect(inputs[0].value).toBe('');
    expect(inputs[1].value).toBe('');
    expectLabelVisible(view.container, 'First Name');
    expectLabelVisible(view.container, 'Last Name');
    expect(layoutContainer.classList.contains('flex-col')).toBe(true);
    expect(layoutContainer.classList.contains('flex-row')).toBe(false);

    const layoutItems = Array.from(layoutContainer.children) as HTMLElement[];
    expect(layoutItems).toHaveLength(2);
    expect(layoutItems.every((item) => !item.style.flexBasis.includes('50%'))).toBe(true);
  });

  it('renders horizontal layout with controls on the same row', () => {
    const { view } = mountForm({ renderers, schema, uischema: horizontalUischema });
    const inputs = Array.from(
      view.container.querySelectorAll<HTMLInputElement>('input[type="text"]'),
    );
    const layoutContainer = findLayoutContainer(view.container, 'row');

    expect(inputs).toHaveLength(2);
    expect(inputs[0].value).toBe('');
    expect(inputs[1].value).toBe('');
    expect(layoutContainer.classList.contains('flex-row')).toBe(true);
    expect(layoutContainer.classList.contains('flex-col')).toBe(false);

    const layoutItems = Array.from(layoutContainer.children) as HTMLElement[];
    expect(layoutItems).toHaveLength(2);
  });

  it('updates core data when a nested control changes', async () => {
    const { view, onchange } = mountForm({
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
  it.each([
    { widths: [4], rows: [0], spans: [4] },
    { widths: [4, undefined], rows: [0, 0], spans: [4, 12] },
    { widths: [4, undefined, undefined], rows: [0, 0, 0], spans: [4, 6, 6] },
    { widths: [4, 4], rows: [0, 0], spans: [4, 4] },
    { widths: [12, 8, undefined], rows: [0, 1, 1], spans: [12, 8, 8] },
    { widths: [undefined, undefined, undefined], rows: [0, 0, 0], spans: [16 / 3, 16 / 3, 16 / 3] },
  ])('sizes and wraps actual browser boxes: $widths', async ({ widths, rows, spans }) => {
    const { view } = mountForm({
      renderers,
      schema,
      uischema: {
        type: 'HorizontalLayout',
        elements: widths.map((columns) => ({
          type: 'Control',
          scope: '#/properties/firstName',
          options: { columns },
        })),
      },
    });
    (view.container as HTMLElement).style.width = '800px';
    await new Promise(requestAnimationFrame);
    const items = Array.from(view.container.querySelectorAll<HTMLElement>('[data-columns]'));
    expect(items).toHaveLength(widths.length);
    const parent = items[0].parentElement!;
    const width = parent.getBoundingClientRect().width;
    const gap = parseFloat(getComputedStyle(parent).columnGap);
    const firstTop = items[0].getBoundingClientRect().top;
    items.forEach((item, index) => {
      const box = item.getBoundingClientRect();
      const count = rows.filter((row) => row === rows[index]).length;
      expect(Math.abs(box.width - ((width - (count - 1) * gap) * spans[index]) / 16)).toBeLessThan(
        1,
      );
      expect(box.right).toBeLessThanOrEqual(parent.getBoundingClientRect().right + 1);
      if (rows[index] === 0) expect(Math.abs(box.top - firstTop)).toBeLessThan(1);
      else expect(box.top).toBeGreaterThan(firstTop);
    });
  });

  it('releases rule-hidden slots without changing document order', async () => {
    const { view, onchange } = mountForm({
      renderers,
      schema,
      data: { firstName: 'visible' },
      uischema: {
        type: 'HorizontalLayout',
        elements: [
          {
            type: 'Control',
            scope: '#/properties/firstName',
            options: { columns: 4 },
            rule: {
              effect: RuleEffect.SHOW,
              condition: { scope: '#/properties/firstName', schema: { const: 'visible' } },
            },
          },
          { type: 'Control', scope: '#/properties/lastName' },
        ],
      },
    });
    expect(view.container.querySelectorAll('[data-columns]')).toHaveLength(2);
    const input = view.container.querySelector<HTMLInputElement>('input')!;
    const before = onchange.mock.calls.length;
    input.value = 'Ada';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await waitForFormChange(onchange, before);
    await new Promise(requestAnimationFrame);
    const items = view.container.querySelectorAll<HTMLElement>('[data-columns]');
    expect(items).toHaveLength(1);
    expect(items[0].dataset.columns).toBe('16');
  });
});
