import { clearAllIds, type JsonSchema, type Translator } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import { entry as anyOfRendererEntry } from '../../src/lib/complex/AnyOfRenderer.entry';
import { entry as stringControlRendererEntry } from '../../src/lib/controls/StringControlRenderer.entry';
import { entry as groupRendererEntry } from '../../src/lib/layouts/GroupRenderer.entry';
import { entry as layoutRendererEntry } from '../../src/lib/layouts/LayoutRenderer.entry';
import { expectValidationError, mountControl, waitForChange } from '../testUtils';

describe('AnyOfRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(async () => {
    await cleanup();
  });

  const renderers = [
    anyOfRendererEntry,
    groupRendererEntry,
    layoutRendererEntry,
    stringControlRendererEntry,
  ];

  const propertySchema: JsonSchema = {
    anyOf: [
      {
        type: 'object',
        title: 'Person',
        properties: {
          name: { type: 'string', title: 'Name', minLength: 3 },
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

  it('renders anyOf tabs and active subschema input', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema,
    });

    const tabs = Array.from(
      view.container.querySelectorAll<HTMLButtonElement>('button[role="tab"]'),
    );
    expect(tabs).toHaveLength(2);

    const input = view.container.querySelector<HTMLInputElement>('input[type="text"]');
    expect(input).toBeTruthy();
    expect(input?.value).toBe('');
  });

  it('updates core data when active anyOf subschema input changes', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema,
      value: { name: 'Ada' },
    });

    const input = view.container.querySelector<HTMLInputElement>('input[type="text"]');
    expect(input).toBeTruthy();
    expect(input?.value).toBe('Ada');

    const before = onchange.mock.calls.length;
    input!.value = 'Grace';
    input!.dispatchEvent(new Event('input', { bubbles: true }));
    const changeEvent = await waitForChange(onchange, before);

    const value = changeEvent.data.value as { name: string };
    expect(value.name).toBe('Grace');
  });

  it('renders validation error for invalid anyOf data', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema,
      value: { name: 'Al' },
    });

    expectValidationError(view.container);
  });
  it('renders a single anyOf branch without navigation or a data write', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: { anyOf: [propertySchema.anyOf![0]] } as JsonSchema,
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
  it('follows incoming data until the user chooses a view, without rewriting it', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema,
      value: { name: 'Ada' },
    });
    const tab = (name: string) =>
      Array.from(view.container.querySelectorAll<HTMLElement>('[role="tab"]')).find(
        (element) => element.textContent?.trim() === name,
      )!;
    await view.rerender({ data: { value: { city: 'Paris' } } });
    await vi.waitFor(() => expect(tab('Location').getAttribute('aria-selected')).toBe('true'));
    tab('Person').click();
    await vi.waitFor(() => expect(tab('Person').getAttribute('aria-selected')).toBe('true'));
    await view.rerender({ data: { value: { city: 'Rome' } } });
    await vi.waitFor(() => expect(tab('Person').getAttribute('aria-selected')).toBe('true'));
    expect(onchange.mock.lastCall?.[0].data).toEqual({ value: { city: 'Rome' } });
  });
  it('shows active-branch errors without changing document validity and honors local opt-out', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema,
      value: { name: 'Ada' },
    });
    const location = Array.from(view.container.querySelectorAll<HTMLElement>('[role="tab"]')).find(
      (element) => element.textContent?.trim() === 'Location',
    )!;
    location.click();
    await vi.waitFor(() =>
      expect(view.container.querySelector('input[aria-invalid="true"]')).not.toBeNull(),
    );
    expect(onchange.mock.lastCall?.[0].errors ?? []).toEqual([]);
    expect(onchange.mock.lastCall?.[0].data).toEqual({ value: { name: 'Ada' } });
    for (const validationMode of ['NoValidation', 'ValidateAndHide'] as const) {
      await view.rerender({ validationMode });
      await vi.waitFor(() =>
        expect(view.container.querySelector('input[aria-invalid="true"]')).toBeNull(),
      );
    }
    await view.rerender({
      validationMode: 'ValidateAndShow',
      config: { validateActiveBranch: false },
    });
    await vi.waitFor(() =>
      expect(view.container.querySelector('input[aria-invalid="true"]')).toBeNull(),
    );
    await view.rerender({
      uischema: {
        type: 'Control',
        scope: '#/properties/value',
        options: { validateActiveBranch: true },
      },
    });
    await vi.waitFor(() =>
      expect(view.container.querySelector('input[aria-invalid="true"]')).not.toBeNull(),
    );
    await view.rerender({
      config: { validateActiveBranch: true },
      uischema: {
        type: 'Control',
        scope: '#/properties/value',
        options: { validateActiveBranch: false },
      },
    });
    await vi.waitFor(() =>
      expect(view.container.querySelector('input[aria-invalid="true"]')).toBeNull(),
    );
  });
  it('uses an explicit branch i18n prefix and updates it without a data edit', async () => {
    const branch = { ...propertySchema.anyOf![0], i18n: 'branch.person' };
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: {
        anyOf: [branch],
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
});
