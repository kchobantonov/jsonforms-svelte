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

  it('follows live inherited direction through native anyOf tabs', async () => {
    const { view, onchange } = await mountControl({ renderers, propertySchema });
    const initialChanges = onchange.mock.calls.length;
    const panel = view.container.querySelector<HTMLElement>('[role="tabpanel"]');
    expect(panel).not.toBeNull();
    view.container.setAttribute('dir', 'rtl');
    await vi.waitFor(() => expect(getComputedStyle(panel!).direction).toBe('rtl'));
    expect(panel?.getAttribute('dir')).toBe('rtl');
    view.container.setAttribute('dir', 'ltr');
    await vi.waitFor(() => expect(getComputedStyle(panel!).direction).toBe('ltr'));
    expect(panel?.getAttribute('dir')).toBe('ltr');
    expect(onchange).toHaveBeenCalledTimes(initialChanges);
  });

  it('preserves an unlike value when changing views and creates the object on the first child edit', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: {
        anyOf: [
          { type: 'string', title: 'Text' },
          {
            type: 'object',
            title: 'Details',
            properties: { note: { type: 'string', title: 'Note' } },
          },
        ],
      },
      value: 'a plain note',
    });
    const detailsTab = Array.from(
      view.container.querySelectorAll<HTMLElement>('[role="tab"]'),
    ).find((element) => element.textContent?.trim() === 'Details');
    expect(detailsTab).toBeTruthy();
    const before = onchange.mock.calls.length;
    detailsTab!.click();
    await vi.waitFor(() => expect(detailsTab?.getAttribute('aria-selected')).toBe('true'));
    expect(onchange.mock.calls).toHaveLength(before);
    const input = view.container.querySelector<HTMLInputElement>(
      'input[id$="/properties/note-input"]',
    );
    expect(input).toBeTruthy();
    input!.value = 'hello';
    input!.dispatchEvent(new Event('input', { bubbles: true }));
    const change = await waitForChange(onchange, before);
    expect(change.data.value).toEqual({ note: 'hello' });
    await view.rerender({ data: {} });
    await vi.waitFor(() => expect(detailsTab?.getAttribute('aria-selected')).toBe('true'));
    const absentInput = view.container.querySelector<HTMLInputElement>(
      'input[id$="/properties/note-input"]',
    );
    expect(absentInput).toBeTruthy();
    const beforeAbsentEdit = onchange.mock.calls.length;
    absentInput!.value = 'first';
    absentInput!.dispatchEvent(new Event('input', { bubbles: true }));
    const absentChange = await waitForChange(onchange, beforeAbsentEdit);
    expect(absentChange.data.value).toEqual({ note: 'first' });
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
    const writesBeforeSelection = onchange.mock.calls.length;
    tab('Person').click();
    await vi.waitFor(() => expect(tab('Person').getAttribute('aria-selected')).toBe('true'));
    expect(onchange.mock.calls).toHaveLength(writesBeforeSelection);
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
    const validity = vi.fn();
    await view.rerender({ onvaliditychange: validity });
    const location = Array.from(view.container.querySelectorAll<HTMLElement>('[role="tab"]')).find(
      (element) => element.textContent?.trim() === 'Location',
    )!;
    location.click();
    await vi.waitFor(() =>
      expect(view.container.querySelector('input[aria-invalid="true"]')).not.toBeNull(),
    );
    expect(onchange.mock.lastCall?.[0].errors ?? []).toEqual([]);
    expect(validity.mock.lastCall?.[0]).toMatchObject({
      current: true,
      valid: true,
      errors: [],
      additionalErrors: [],
    });
    expect(onchange.mock.lastCall?.[0].data).toEqual({ value: { name: 'Ada' } });
    for (const validationMode of ['NoValidation', 'ValidateAndHide'] as const) {
      await view.rerender({ validationMode });
      expect(validity.mock.lastCall?.[0]).toMatchObject({
        current: validationMode !== 'NoValidation',
        valid: validationMode !== 'NoValidation',
      });
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
