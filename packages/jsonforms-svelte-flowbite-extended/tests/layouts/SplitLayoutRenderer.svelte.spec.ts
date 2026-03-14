import { stringControlRendererEntry } from '@chobantonov/jsonforms-svelte-flowbite';
import { clearAllIds, type JsonSchema, type UISchemaElement } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { splitLayoutRendererEntry } from '../../src/lib/layouts';
import { expectLabelVisible, mountForm, waitForFormChange } from '../testUtils';

const findSplitPaneContainer = (container: HTMLElement): HTMLDivElement => {
  const candidates = Array.from(
    container.querySelectorAll<HTMLDivElement>('div.relative.flex.w-full.overflow-hidden'),
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
    expect(splitPane.classList.contains('flex-col')).toBe(false);
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
    expect(splitPane.classList.contains('flex-col')).toBe(true);
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
});
