import { flowbiteRenderers } from '../../src/lib/renderers';
import { cleanup } from 'vitest-browser-svelte';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import type { JsonSchema, Translator } from '@jsonforms/core';
import { mountForm } from '../testUtils';

afterEach(cleanup);

it.each([
  {
    name: 'root pointer',
    nestedId: false,
    anchor: false,
    reference: '#/$defs/Node',
    rootReference: '#/$defs/Node',
  },
  {
    name: 'nested id',
    nestedId: true,
    anchor: false,
    reference: '#',
    rootReference: '#/$defs/Node',
  },
  {
    name: 'root anchor',
    nestedId: false,
    anchor: true,
    reference: '#node',
    rootReference: '#node',
  },
  {
    name: 'nested id anchor',
    nestedId: true,
    anchor: true,
    reference: '#node',
    rootReference: 'node.json#node',
  },
])(
  'edits finite recursion through a $name',
  async ({ nestedId, anchor, reference, rootReference }) => {
    const schema = {
      $id: 'https://example.test/root.json',
      type: 'object',
      $defs: {
        Node: {
          ...(nestedId ? { $id: 'node.json' } : {}),
          ...(anchor ? { $anchor: 'node' } : {}),
          type: 'object',
          properties: { label: { type: 'string' }, child: { $ref: reference } },
        },
      },
      properties: { node: { $ref: rootReference } },
    } as JsonSchema;
    const data = { node: { label: 'Root', child: { label: 'Leaf' } } };
    const { view, onchange } = await mountForm({
      schema,
      data,
      uischema: { type: 'Control', scope: '#/properties/node' },
      renderers: flowbiteRenderers,
    });
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual(data));
    const values = Array.from(view.container.querySelectorAll<HTMLInputElement>('input')).map(
      (input) => input.value,
    );
    expect(values).toContain('Root');
    expect(values).toContain('Leaf');
    await page.getByRole('textbox', { name: 'Label' }).nth(1).fill('Edited leaf');
    await vi.waitFor(() =>
      expect(onchange.mock.lastCall?.[0].data).toEqual({
        node: { label: 'Root', child: { label: 'Edited leaf' } },
      }),
    );
    await page.getByRole('button', { name: 'Add node' }).click();
    await vi.waitFor(() =>
      expect(onchange.mock.lastCall?.[0].data).toEqual({
        node: { label: 'Root', child: { label: 'Edited leaf', child: {} } },
      }),
    );
    await page.getByRole('textbox', { name: 'Label' }).nth(2).fill('Grandchild');
    await vi.waitFor(() =>
      expect(onchange.mock.lastCall?.[0].data).toEqual({
        node: { label: 'Root', child: { label: 'Edited leaf', child: { label: 'Grandchild' } } },
      }),
    );
  },
);

it.each(['en', 'bg'])(
  'reports an unknown local anchor in %s and recovers on schema replacement',
  async (locale) => {
    const schema = {
      $id: 'https://example.test/root.json',
      type: 'object',
      properties: { value: { $ref: '#missing' } },
    } as JsonSchema;
    const data = { value: 'Kept' };
    const { view, onchange } = await mountForm({
      schema,
      data,
      uischema: { type: 'Control', scope: '#/properties/value' },
      renderers: flowbiteRenderers,
      i18n: { locale },
    });
    const alert = view.container.querySelector('[data-schema-reference-error]');
    expect(alert?.textContent).toContain('https://example.test/root.json#missing');
    expect(alert?.textContent).toContain(locale === 'bg' ? 'Неразрешена' : 'Unresolved');
    expect(view.container.querySelector('input')).toBeNull();
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual(data));
    const validity = vi.fn();
    await view.rerender({ onvaliditychange: validity });
    await vi.waitFor(() => expect(validity.mock.lastCall?.[0].valid).toBe(false));
    expect(validity.mock.lastCall?.[0].current).toBe(false);
    expect(validity.mock.lastCall?.[0].additionalErrors).toHaveLength(1);
    const replacement = { value: 'Host replacement' };
    await view.rerender({ data: replacement });
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual(replacement));
    expect(view.container.querySelector('[data-schema-reference-error]')).not.toBeNull();
    expect(validity.mock.lastCall?.[0].valid).toBe(false);

    await view.rerender({ validationMode: 'NoValidation' });
    expect(view.container.querySelector('[data-schema-reference-error]')).not.toBeNull();
    expect(validity.mock.lastCall?.[0].valid).toBe(false);
    await view.rerender({ validationMode: 'ValidateAndShow' });

    await view.rerender({
      schema: { type: 'object', properties: { value: { type: 'string' } } },
    });
    await vi.waitFor(() =>
      expect(view.container.querySelector('[data-schema-reference-error]')).toBeNull(),
    );
    await vi.waitFor(() => expect(validity.mock.lastCall?.[0].valid).toBe(true));
    expect(validity.mock.lastCall?.[0].current).toBe(true);
    expect(onchange.mock.lastCall?.[0].data).toEqual(replacement);
    await page.getByRole('textbox').fill('Edited');
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual({ value: 'Edited' }));
  },
);

it('reports an unknown anchor when NoValidation is the initial mode', async () => {
  const data = { value: 'Kept' };
  const { view, onchange } = await mountForm({
    schema: {
      $id: 'https://example.test/root.json',
      type: 'object',
      properties: { value: { $ref: '#missing' } },
    } as JsonSchema,
    data,
    uischema: { type: 'Control', scope: '#/properties/value' },
    renderers: flowbiteRenderers,
    validationMode: 'NoValidation',
  });
  expect(view.container.querySelector('[data-schema-reference-error]')?.textContent).toContain(
    'https://example.test/root.json#missing',
  );
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual(data));
  const validity = vi.fn();
  await view.rerender({ onvaliditychange: validity });
  await vi.waitFor(() => expect(validity.mock.lastCall?.[0].valid).toBe(false));
  expect(validity.mock.lastCall?.[0].current).toBe(false);
  expect(validity.mock.lastCall?.[0].additionalErrors).toHaveLength(1);
});

it('uses the host translation for an unresolved schema reference', async () => {
  const { view } = await mountForm({
    schema: {
      $id: 'https://example.test/root.json',
      type: 'object',
      properties: { value: { $ref: '#missing' } },
    } as JsonSchema,
    data: { value: 'Kept' },
    uischema: { type: 'Control', scope: '#/properties/value' },
    renderers: flowbiteRenderers,
    i18n: {
      locale: 'en',
      translate: ((key: string, fallback?: string) =>
        key === 'reference.unresolved' ? 'Host reference: {reference}' : fallback) as Translator,
    },
  });
  expect(view.container.querySelector('[data-schema-reference-error]')?.textContent).toContain(
    'Host reference: https://example.test/root.json#missing',
  );
});
