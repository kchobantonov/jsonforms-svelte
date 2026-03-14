import { clearAllIds, type JsonSchema } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { entry as oneOfRendererEntry } from '../../src/lib/complex/OneOfRenderer.entry';
import { entry as stringControlRendererEntry } from '../../src/lib/controls/StringControlRenderer.entry';
import { entry as groupRendererEntry } from '../../src/lib/layouts/GroupRenderer.entry';
import { entry as layoutRendererEntry } from '../../src/lib/layouts/LayoutRenderer.entry';
import { mountControl, waitForChange } from '../testUtils';

const getComboboxTrigger = (container: HTMLElement): HTMLButtonElement => {
  const byRole = container.querySelector<HTMLButtonElement>('button[aria-haspopup="listbox"]');
  if (byRole) return byRole;

  const byPart = container.querySelector<HTMLButtonElement>('button[data-part="trigger"]');
  if (byPart) return byPart;

  const fallback = Array.from(container.querySelectorAll<HTMLButtonElement>('button')).find(
    (button) => (button.getAttribute('aria-label') ?? '').toLowerCase() !== 'clear value',
  );
  expect(fallback).toBeTruthy();
  return fallback as HTMLButtonElement;
};

const chooseComboboxOption = async (container: HTMLElement, label: string) => {
  getComboboxTrigger(container).click();

  let option: HTMLElement | undefined;
  await vi.waitFor(() => {
    option = Array.from(document.querySelectorAll<HTMLElement>('[role="option"]')).find(
      (candidate) => (candidate.textContent ?? '').trim().toLowerCase() === label.toLowerCase(),
    );
    expect(option).toBeTruthy();
  });

  option!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
};

describe('OneOfRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(() => {
    cleanup();
  });

  const renderers = [
    oneOfRendererEntry,
    groupRendererEntry,
    layoutRendererEntry,
    stringControlRendererEntry,
  ];

  const propertySchema: JsonSchema = {
    oneOf: [
      {
        type: 'object',
        title: 'Person',
        properties: {
          name: { type: 'string', title: 'Name' },
        },
        required: ['name'],
      },
      {
        type: 'object',
        title: 'Location',
        properties: {
          city: { type: 'string', title: 'City' },
        },
        required: ['city'],
      },
    ],
  };

  it('renders oneOf selector when no data is provided', () => {
    const { view } = mountControl({ renderers, propertySchema });

    const input = view.container.querySelector<HTMLInputElement>('input[id$="-input"]');
    expect(input).toBeTruthy();
    expect(input?.value ?? '').toBe('');
  });

  it('updates core data when selecting a oneOf schema from empty data', async () => {
    const { view, onchange } = mountControl({ renderers, propertySchema });

    const before = onchange.mock.calls.length;
    await chooseComboboxOption(view.container, 'Person');
    const changeEvent = await waitForChange(onchange, before);

    expect(typeof changeEvent.data.value).toBe('object');
    expect(changeEvent.data.value).toBeTruthy();
  });

  it('updates core data when active oneOf subschema input changes', async () => {
    const { view, onchange } = mountControl({
      renderers,
      propertySchema,
      value: { name: 'Ada' },
    });

    const input = Array.from(
      view.container.querySelectorAll<HTMLInputElement>('input[type="text"]'),
    ).find((candidate) => candidate.value === 'Ada');
    expect(input).toBeTruthy();

    const before = onchange.mock.calls.length;
    input!.value = 'Grace';
    input!.dispatchEvent(new Event('input', { bubbles: true }));
    const changeEvent = await waitForChange(onchange, before);

    const value = changeEvent.data.value as { name: string };
    expect(value.name).toBe('Grace');
  });
});
