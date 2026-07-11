import { clearAllIds, type JsonSchema, type UISchemaElement } from '@jsonforms/core';
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
    expect(layoutItems.every((item) => !item.classList.contains('flex-1'))).toBe(true);
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
    expect(layoutItems.every((item) => item.classList.contains('flex-1'))).toBe(true);
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
});
