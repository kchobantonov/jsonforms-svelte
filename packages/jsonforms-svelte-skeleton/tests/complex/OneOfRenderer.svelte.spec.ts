import { skeletonRenderers } from '../../src/lib/renderers';
import { clearAllIds, type JsonSchema, type Translator } from '@jsonforms/core';
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
    await vi.waitFor(() =>
      expect(view.container.querySelector('input[id*="/properties/name"]')).not.toBeNull(),
    );
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
  it('honors never-confirm policy and preserves only enclosing properties', async () => {
    const { view, onchange } = mountControl({
      renderers,
      propertySchema: {
        ...propertySchema,
        properties: { retained: { type: 'string' } },
        oneOf: [
          propertySchema.oneOf![0],
          { ...propertySchema.oneOf![1], default: { city: 'New city' } },
        ],
      } as JsonSchema,
      value: { name: 'Ada', retained: 'keep me' },
      options: { confirmation: { branchChange: 'never' } },
    });
    const before = onchange.mock.calls.length;
    await chooseComboboxOption(view.container, 'Location');
    const change = await waitForChange(onchange, before);
    expect(change.data.value).toEqual({ city: 'New city', retained: 'keep me' });
  });
  it('renders a single oneOf branch without navigation or a data write', async () => {
    const { view, onchange } = mountControl({
      renderers,
      propertySchema: { oneOf: [propertySchema.oneOf![0]] } as JsonSchema,
      value: { name: 'Existing name' },
    });
    const input = view.container.querySelector<HTMLInputElement>('input[type="text"]');
    expect(input?.value).toBe('Existing name');
    expect(
      view.container.querySelector(
        '[role="tab"], select, [role="combobox"], [aria-haspopup="listbox"]',
      ),
    ).toBeNull();
    const emitted = onchange.mock.calls.map(([event]) => event.data);
    expect(emitted.every((data) => data.value.name === 'Existing name')).toBe(true);
  });
  it('uses an explicit branch i18n prefix and updates it without a data edit', async () => {
    const branch = { ...propertySchema.oneOf![0], i18n: 'branch.person' };
    const { view, onchange } = mountControl({
      renderers,
      propertySchema: {
        oneOf: [branch],
      } as JsonSchema,
      value: { name: 'Ada' },
    });
    for (const label of ['Individu', 'Човек', '']) {
      await view.rerender({
        i18n: {
          locale: 'custom',
          translate: ((key, fallback) =>
            key === 'branch.person.label' ? label : fallback) as Translator,
        },
      });
      await vi.waitFor(() => {
        expect(view.container.textContent).not.toContain('Person');
        if (label) expect(view.container.textContent).toContain(label);
      });
    }
    expect(onchange.mock.lastCall?.[0].data).toEqual({ value: { name: 'Ada' } });
  });
  it('updates an open confirmation dialog when the locale or host translation changes', async () => {
    const { view, onchange } = mountControl({ renderers, propertySchema, value: { name: 'Ada' } });
    await chooseComboboxOption(view.container, 'Location');
    await vi.waitFor(() => expect(document.body.textContent).toContain('Clear form?'));
    await view.rerender({ i18n: { locale: 'bg' } });
    await vi.waitFor(() => expect(document.body.textContent).toContain('Изчистване на формуляра?'));
    await view.rerender({
      i18n: {
        locale: 'fr',
        translate: ((key, fallback) =>
          key.endsWith('.clearDialogTitle') ? 'Effacer les données ?' : fallback) as Translator,
      },
    });
    await vi.waitFor(() => expect(document.body.textContent).toContain('Effacer les données ?'));
    expect(onchange.mock.lastCall?.[0].data).toEqual({ value: { name: 'Ada' } });
  });
  it('keeps an object-only array slot when clearing its branch', async () => {
    const { view, onchange } = mountControl({
      renderers: skeletonRenderers,
      propertySchema: {
        type: 'array',
        items: { type: 'object', oneOf: propertySchema.oneOf },
      } as JsonSchema,
      value: [{ name: 'Ada' }],
      options: {
        detail: {
          type: 'Control',
          scope: '#',
          options: { confirmation: { branchChange: 'never' } },
        },
      },
    });
    const before = onchange.mock.calls.length;
    const clear = view.container.querySelector<HTMLButtonElement>(
      'button[aria-label="Clear value"]',
    )!;
    expect(clear).toBeTruthy();
    clear.click();
    const event = await waitForChange(onchange, before);
    expect(event.data.value).toEqual([{}]);
    expect(Object.hasOwn(event.data.value as object, '0')).toBe(true);
  });
  it('follows incoming branch data and removes stale detail when the node disappears', async () => {
    const { view, onchange } = mountControl({ renderers, propertySchema, value: { name: 'Ada' } });
    await view.rerender({ data: { value: { city: 'Paris' } } });
    await vi.waitFor(() =>
      expect(
        view.container.querySelector<HTMLInputElement>('input[id*="/properties/city"]')?.value,
      ).toBe('Paris'),
    );
    expect(onchange.mock.lastCall?.[0].data).toEqual({ value: { city: 'Paris' } });
    await view.rerender({ data: {} });
    await vi.waitFor(() =>
      expect(view.container.querySelector('input[id*="/properties/city"]')).toBeNull(),
    );
    expect(onchange.mock.lastCall?.[0].data).toEqual({});
  });
  it('localizes missing discriminator feedback and suppresses it with hidden validation', async () => {
    const schema = {
      oneOf: ['email', 'post'].map((kind) => ({
        type: 'object',
        title: kind,
        properties: { kind: { const: kind } },
        required: ['kind'],
      })),
    };
    const { view, onchange } = mountControl({ renderers, propertySchema: schema, value: {} });
    await vi.waitFor(() => expect(view.container.textContent).toContain('Choose a kind.'));
    await view.rerender({ i18n: { locale: 'bg' } });
    await vi.waitFor(() => expect(view.container.textContent).toContain('Изберете вид.'));
    await view.rerender({ validationMode: 'ValidateAndHide' });
    await vi.waitFor(() => expect(view.container.textContent).not.toContain('Изберете вид.'));
    expect(onchange.mock.lastCall?.[0].data).toEqual({ value: {} });
  });
});
