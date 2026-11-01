import { shadcnRenderers } from '../../src/lib/renderers';
import { clearAllIds, type JsonSchema, type Translator } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import { entry as oneOfRendererEntry } from '../../src/lib/complex/OneOfRenderer.entry';
import { entry as stringControlRendererEntry } from '../../src/lib/controls/StringControlRenderer.entry';
import { entry as groupRendererEntry } from '../../src/lib/layouts/GroupRenderer.entry';
import { entry as layoutRendererEntry } from '../../src/lib/layouts/LayoutRenderer.entry';
import { mountControl, mountForm, waitForChange } from '../testUtils';

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
  getComboboxTrigger(container).dispatchEvent(
    new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }),
  );

  let option: HTMLElement | undefined;
  await vi.waitFor(() => {
    option = Array.from(document.querySelectorAll<HTMLElement>('[role="option"]')).find(
      (candidate) => (candidate.textContent ?? '').trim().toLowerCase() === label.toLowerCase(),
    );
    expect(option).toBeTruthy();
  });

  option!.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'mouse' }));
};

describe('OneOfRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(async () => {
    await cleanup();
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

  it('renders oneOf selector when no data is provided', async () => {
    const { view } = await mountControl({ renderers, propertySchema });

    const trigger = getComboboxTrigger(view.container);
    expect(trigger.textContent).toContain('Select an option');
  });

  it('updates core data when selecting a oneOf schema from empty data', async () => {
    const { view, onchange } = await mountControl({ renderers, propertySchema });

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
    const { view, onchange } = await mountControl({
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
    const { view, onchange } = await mountControl({
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
    const { view, onchange } = await mountControl({
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
    const { view, onchange } = await mountControl({
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
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema,
      value: { name: 'Ada' },
    });
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
    const { view, onchange } = await mountControl({
      renderers: shadcnRenderers,
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
  it('retains an explicit editing branch when incoming data matches overlapping alternatives', async () => {
    const schema = {
      oneOf: [
        {
          type: 'object',
          title: 'First',
          properties: { shared: { type: 'string' }, firstNote: { type: 'string' } },
          required: ['shared'],
        },
        {
          type: 'object',
          title: 'Second',
          properties: { shared: { type: 'string' }, secondNote: { type: 'string' } },
          required: ['shared'],
        },
      ],
    } as JsonSchema;
    const value = { shared: 'ambiguous' };
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: schema,
      value,
      options: { confirmation: { branchChange: 'never' } },
    });
    expect(onchange.mock.lastCall?.[0].data).toEqual({ value });
    expect(onchange.mock.lastCall?.[0].errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ keyword: 'oneOf' })]),
    );
    expect(view.container.querySelector('input[id*="/properties/firstNote"]')).not.toBeNull();
    await chooseComboboxOption(view.container, 'Second');
    await vi.waitFor(() =>
      expect(view.container.querySelector('input[id*="/properties/secondNote"]')).not.toBeNull(),
    );
    await view.rerender({ data: { value: { shared: 'external' } } });
    await vi.waitFor(() =>
      expect(view.container.querySelector('input[id*="/properties/secondNote"]')).not.toBeNull(),
    );
    expect(view.container.querySelector('input[id*="/properties/firstNote"]')).toBeNull();
    expect(onchange.mock.lastCall?.[0].data).toEqual({ value: { shared: 'external' } });
    expect(onchange.mock.lastCall?.[0].errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ keyword: 'oneOf' })]),
    );
  });
  it('follows a new discriminator after the user previously chose another branch', async () => {
    const schema = {
      oneOf: [
        {
          type: 'object',
          title: 'Email',
          properties: { kind: { const: 'email' }, email: { type: 'string' } },
          required: ['kind', 'email'],
        },
        {
          type: 'object',
          title: 'Phone',
          properties: { kind: { const: 'phone' }, phone: { type: 'string' } },
          required: ['kind', 'phone'],
          default: { kind: 'phone', phone: '' },
        },
      ],
    } as JsonSchema;
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: schema,
      value: { kind: 'email', email: 'original' },
      options: { confirmation: { branchChange: 'never' } },
    });
    await chooseComboboxOption(view.container, 'Phone');
    await vi.waitFor(() =>
      expect(onchange.mock.lastCall?.[0].data).toEqual({ value: { kind: 'phone', phone: '' } }),
    );
    await view.rerender({ data: { value: { kind: 'email', email: 'external' } } });
    await vi.waitFor(() =>
      expect(
        view.container.querySelector<HTMLInputElement>('input[id*="/properties/email"]')?.value,
      ).toBe('external'),
    );
    expect(view.container.querySelector('input[id*="/properties/phone"]')).toBeNull();
    expect(onchange.mock.lastCall?.[0].data).toEqual({
      value: { kind: 'email', email: 'external' },
    });
  });
  it('follows incoming branch data and removes stale detail when the node disappears', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema,
      value: { name: 'Ada' },
    });
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
    const { view, onchange } = await mountControl({ renderers, propertySchema: schema, value: {} });
    await vi.waitFor(() => expect(view.container.textContent).toContain('Choose a kind.'));
    await view.rerender({ i18n: { locale: 'bg' } });
    await vi.waitFor(() => expect(view.container.textContent).toContain('Изберете вид.'));
    await view.rerender({ validationMode: 'ValidateAndHide' });
    await vi.waitFor(() => expect(view.container.textContent).not.toContain('Изберете вид.'));
    expect(onchange.mock.lastCall?.[0].data).toEqual({ value: {} });
  });
  it('keeps a literal dotted oneOf member separate from its nested lookalike', async () => {
    const schema = {
      type: 'object',
      properties: {
        'a.b': {
          oneOf: [
            {
              type: 'object',
              title: 'Email',
              properties: { kind: { const: 'email' }, email: { type: 'string' } },
              required: ['kind', 'email'],
            },
            {
              type: 'object',
              title: 'Post',
              properties: { kind: { const: 'post' }, address: { type: 'string' } },
              required: ['kind', 'address'],
            },
          ],
        },
        a: {
          type: 'object',
          properties: { b: { type: 'object', properties: { kind: { const: 'post' } } } },
        },
      },
    } as JsonSchema;
    const data = { 'a.b': {}, a: { b: { kind: 'post' } } };
    const { view, onchange } = await mountForm({
      renderers: shadcnRenderers,
      schema,
      uischema: {
        type: 'Control',
        scope: '#/properties/a.b',
        options: { confirmation: { branchChange: 'never' } },
      },
      data,
    });
    expect(onchange.mock.lastCall?.[0].data).toEqual(data);
    expect(view.container.textContent).toContain('Choose a kind.');
    const replacement = { 'a.b': { kind: 'post', address: '12 Main' }, a: { b: { kind: 'post' } } };
    await view.rerender({ data: replacement });
    await vi.waitFor(() =>
      expect(
        view.container.querySelector<HTMLInputElement>('input[id*="/properties/address"]')?.value,
      ).toBe('12 Main'),
    );
    expect(onchange.mock.lastCall?.[0].data).toEqual(replacement);
    const literalError = {
      instancePath: '/a.b/address',
      schemaPath: '#/host/literal',
      keyword: 'host',
      params: {},
      message: 'Literal address error',
    };
    await view.rerender({ additionalErrors: [literalError] });
    await vi.waitFor(() => expect(view.container.textContent).toContain('Literal address error'));
    await view.rerender({
      additionalErrors: [
        { ...literalError, instancePath: '/a/b/kind', message: 'Nested kind error' },
      ],
    });
    await vi.waitFor(() =>
      expect(view.container.textContent).not.toContain('Literal address error'),
    );
    expect(view.container.textContent).not.toContain('Nested kind error');
    const address = view.container.querySelector<HTMLInputElement>(
      'input[id*="/properties/address"]',
    )!;
    const before = onchange.mock.calls.length;
    address.value = '34 Oak';
    address.dispatchEvent(new Event('input', { bubbles: true }));
    const changed = await waitForChange(onchange, before);
    expect(changed.data).toEqual({
      'a.b': { kind: 'post', address: '34 Oak' },
      a: { b: { kind: 'post' } },
    });
    const clear = view.container.querySelector<HTMLButtonElement>(
      'button[aria-label="Clear value"]',
    )!;
    expect(clear).toBeTruthy();
    const beforeClear = onchange.mock.calls.length;
    clear.click();
    const cleared = await waitForChange(onchange, beforeClear);
    expect(cleared.data).toEqual({ a: { b: { kind: 'post' } } });
  });
  it('retains invalid nonempty data while displaying a fallback branch for correction', async () => {
    const value = { name: 3, extra: 'keep' };
    const { view, onchange } = await mountControl({ renderers, propertySchema, value });
    expect(onchange.mock.lastCall?.[0].data).toEqual({ value });
    expect(onchange.mock.lastCall?.[0].errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ keyword: 'oneOf' })]),
    );
    expect(view.container.querySelector('input[id*="/properties/name"]')).not.toBeNull();
    expect(view.container.querySelector('input[id*="/properties/city"]')).toBeNull();
    expect(getComboboxTrigger(view.container).textContent).toContain('Person');
  });
  it('keeps a recursive folder selected when its populated file descendant is invalid', async () => {
    const data = {
      node: {
        kind: 'folder',
        name: 'Root',
        children: [{ kind: 'file', name: '', content: 'Text' }],
      },
    };
    const { view, onchange } = await mountForm({
      renderers: shadcnRenderers,
      schema: {
        type: 'object',
        $defs: {
          Node: { oneOf: [{ $ref: '#/$defs/File' }, { $ref: '#/$defs/Folder' }] },
          File: {
            type: 'object',
            title: 'File',
            properties: {
              kind: { const: 'file', type: 'string' },
              name: { type: 'string', minLength: 1 },
              content: { type: 'string' },
            },
            required: ['kind', 'name'],
            default: { kind: 'file' },
          },
          Folder: {
            type: 'object',
            title: 'Folder',
            properties: {
              kind: { const: 'folder', type: 'string' },
              name: { type: 'string', minLength: 1 },
              children: { type: 'array', items: { $ref: '#/$defs/Node' } },
            },
            required: ['kind', 'name', 'children'],
            default: { kind: 'folder', children: [] },
          },
        },
        properties: { node: { $ref: '#/$defs/Node' } },
      } as JsonSchema,
      uischema: { type: 'Control', scope: '#/properties/node' },
      data,
    });
    expect(onchange.mock.lastCall?.[0].data).toEqual(data);
    expect(onchange.mock.lastCall?.[0].errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ keyword: 'minLength', instancePath: '/node/children/0/name' }),
      ]),
    );
    expect(
      Array.from(view.container.querySelectorAll<HTMLInputElement>('input')).map(
        (input) => input.value,
      ),
    ).toEqual(expect.arrayContaining(['Root', 'Text']));
    expect(view.container.textContent).toContain('Children');
    const add = view.container.querySelector<HTMLButtonElement>(
      'button[aria-label="Add to Children button"]',
    );
    expect(add).not.toBeNull();
    const before = onchange.mock.calls.length;
    add!.click();
    const event = await waitForChange(onchange, before);
    expect((event.data as { node: { children: unknown[] } }).node.children).toEqual([
      data.node.children[0],
      { kind: 'file' },
    ]);
  });

  it('selects a referenced branch from a nested schema resource when another field is invalid', async () => {
    const schema = {
      $id: 'https://example.test/tree',
      type: 'object',
      $defs: {
        Branches: {
          $id: './branches',
          $defs: {
            File: {
              $anchor: 'file',
              type: 'object',
              title: 'File',
              properties: {
                kind: { const: 'file' },
                name: { type: 'string', minLength: 1 },
              },
              required: ['kind', 'name'],
            },
            Folder: {
              $anchor: 'folder',
              type: 'object',
              title: 'Folder',
              properties: {
                kind: { const: 'folder' },
                children: {
                  type: 'array',
                  items: { $ref: 'https://example.test/tree#/$defs/Node' },
                },
              },
              required: ['kind', 'children'],
            },
          },
        },
        Node: { oneOf: [{ $ref: './branches#file' }, { $ref: './branches#folder' }] },
      },
      properties: { node: { $ref: '#/$defs/Node' } },
    } as JsonSchema;
    const data = { node: { kind: 'file', name: '' } };
    const { view, onchange } = await mountForm({
      renderers: shadcnRenderers,
      schema,
      uischema: { type: 'Control', scope: '#/properties/node' },
      data,
    });
    expect(onchange.mock.lastCall?.[0].data).toEqual(data);
    expect(onchange.mock.lastCall?.[0].errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ keyword: 'minLength', instancePath: '/node/name' }),
      ]),
    );
    expect(getComboboxTrigger(view.container).textContent).toContain('File');
    expect(view.container.querySelector('input[id*="/properties/name"]')).not.toBeNull();
    expect(view.container.querySelector('button[aria-label="Add to Children button"]')).toBeNull();
    const replacement = { node: { kind: 'folder', children: [{ kind: 'file', name: '' }] } };
    await view.rerender({ data: replacement });
    await vi.waitFor(() =>
      expect(
        view.container.querySelector('button[aria-label="Add to Children button"]'),
      ).not.toBeNull(),
    );
    expect(onchange.mock.lastCall?.[0].data).toEqual(replacement);
    expect(onchange.mock.lastCall?.[0].errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ keyword: 'minLength', instancePath: '/node/children/0/name' }),
      ]),
    );
  });

  it('renders a root oneOf whose folder children refer back to the root schema', async () => {
    const schema = {
      $defs: {
        File: {
          type: 'object',
          title: 'File',
          properties: { kind: { const: 'file' }, name: { type: 'string' } },
          required: ['kind', 'name'],
        },
        Folder: {
          type: 'object',
          title: 'Folder',
          properties: {
            kind: { const: 'folder' },
            name: { type: 'string' },
            children: { type: 'array', items: { $ref: '#' } },
          },
          required: ['kind', 'name', 'children'],
        },
      },
      oneOf: [{ $ref: '#/$defs/File' }, { $ref: '#/$defs/Folder' }],
    } as JsonSchema;
    const data = {
      kind: 'folder',
      name: 'Documents',
      children: [{ kind: 'file', name: 'readme.txt' }],
    };
    const { view, onchange } = await mountForm({
      renderers: shadcnRenderers,
      schema,
      uischema: { type: 'Control', scope: '#' },
      data,
    });
    expect(onchange.mock.lastCall?.[0].data).toEqual(data);
    expect(view.container.textContent).not.toContain('No applicable renderer');
    expect(
      Array.from(view.container.querySelectorAll<HTMLInputElement>('input')).some(
        (input) => input.value === 'Documents',
      ),
    ).toBe(true);
    view.container.querySelector<HTMLElement>('[data-array-avatar]')?.click();
    await vi.waitFor(() =>
      expect(
        Array.from(view.container.querySelectorAll<HTMLInputElement>('input')).some(
          (input) => input.value === 'readme.txt',
        ),
      ).toBe(true),
    );
  });
});
