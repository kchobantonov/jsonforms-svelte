import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import JsonForms from '../src/lib/components/JsonForms.svelte';
import LiteralInput from './fixtures/LiteralInput.svelte';
import OwnedErrorRenderer from './fixtures/OwnedErrorRenderer.svelte';
import type { OwnedErrorStore, JsonFormsValidityEvent } from '../src/lib/ownedErrors';
import type { JsonSchema, UISchemaElement } from '@jsonforms/core';

afterEach(cleanup);
it.each(['legacy.key', '', 'a.b/c~d', 'a~b~c', '#'])(
  'edits declared literal key %j while preserving unrelated values and live permissions',
  async (key) => {
    const onchange = vi.fn();
    const schema = {
      type: 'object',
      properties: {
        [key]: { type: 'string', minLength: 2, title: 'Literal' },
        legacy: { type: 'object' },
      },
      required: [key],
    } as JsonSchema;
    const uischema = {
      type: 'Control',
      scope: '#/properties/' + key.replaceAll('~', '~0').replaceAll('/', '~1'),
    } as UISchemaElement;
    const original = { [key]: 'A', legacy: { key: 'B' }, other: 'C' };
    const view = render(JsonForms, {
      props: {
        schema,
        uischema,
        data: original,
        renderers: [{ tester: () => 1, renderer: LiteralInput }],
        onchange,
      },
    });
    const field = page.getByRole('textbox', { name: 'Literal' });
    await expect.element(field).toHaveValue('A');
    await expect.element(field).toHaveAttribute('required');
    await expect.element(field).toHaveAttribute('aria-invalid', 'true');
    await field.fill('Done');
    await vi.waitFor(() =>
      expect(onchange.mock.lastCall?.[0].data).toEqual({ ...original, [key]: 'Done' }),
    );
    await expect.element(field).toHaveAttribute('aria-invalid', 'false');
    await view.getByRole('button', { name: 'Clear' }).click();
    await expect.poll(() => Object.hasOwn(onchange.mock.lastCall?.[0].data ?? {}, key)).toBe(false);
    expect(onchange.mock.lastCall?.[0].data.legacy).toEqual({ key: 'B' });
    expect(original[key]).toBe('A');
    await view.rerender({ readonly: true, data: { ...original, [key]: 'External' } });
    await expect.element(field).toHaveValue('External');
    await expect.element(field).toBeDisabled();
  },
);

it('keeps missing required and host errors on the literal property', async () => {
  const view = render(JsonForms, {
    props: {
      schema: {
        type: 'object',
        properties: { 'a.b': { type: 'string', title: 'Literal' } },
        required: ['a.b'],
      },
      uischema: { type: 'Control', scope: '#/properties/a.b' },
      data: {},
      renderers: [{ tester: () => 1, renderer: LiteralInput }],
    },
  });
  const field = page.getByRole('textbox', { name: 'Literal' });
  await expect.element(field).toHaveAttribute('aria-invalid', 'true');
  await view.rerender({
    data: { 'a.b': 'Present' },
    additionalErrors: [
      {
        instancePath: '/a.b',
        keyword: 'server',
        schemaPath: '',
        params: {},
        message: 'Literal server error',
      },
    ],
  });
  await expect.element(page.getByText('Literal server error')).toBeVisible();
  await view.rerender({
    additionalErrors: [
      {
        instancePath: '/a/b',
        keyword: 'server',
        schemaPath: '',
        params: {},
        message: 'Nested server error',
      },
    ],
  });
  await expect.element(field).toHaveAttribute('aria-invalid', 'false');
});

it('publishes renderer-owned errors at the original literal JSON Pointer', async () => {
  let store: OwnedErrorStore | undefined;
  const validity = vi.fn<(event: JsonFormsValidityEvent) => void>();
  render(JsonForms, {
    props: {
      schema: { type: 'object', properties: { 'a.b/c': { type: 'string' } } },
      data: { 'a.b/c': 'value' },
      uischema: {
        type: 'Control',
        scope: '#/properties/a.b~1c',
        options: {
          capture: (context: { store: OwnedErrorStore }) => {
            store = context.store;
          },
        },
      },
      renderers: [{ tester: () => 1, renderer: OwnedErrorRenderer }],
      onvaliditychange: validity,
    },
  });
  await vi.waitFor(() => expect(store).toBeDefined());
  const owner = store!.createOwner();
  const generation = owner.begin('', true);
  owner.publish(generation, [
    { instancePath: '', keyword: 'editor', schemaPath: '', params: {}, message: 'Draft error' },
  ]);
  await vi.waitFor(() =>
    expect(validity.mock.lastCall?.[0].additionalErrors).toMatchObject([
      { instancePath: '/a.b~1c', message: 'Draft error' },
    ]),
  );
  owner.dispose();
  await vi.waitFor(() => expect(validity.mock.lastCall?.[0].additionalErrors).toEqual([]));
});

it('releases an outgoing literal control when the host replaces it with a layout', async () => {
  const view = render(JsonForms, {
    props: {
      schema: { type: 'object', properties: { 'a.b': { type: 'string', title: 'Literal' } } },
      uischema: { type: 'Control', scope: '#/properties/a.b' },
      data: { 'a.b': 'Original' },
      renderers: [{ tester: (ui) => (ui.type === 'Control' ? 1 : -1), renderer: LiteralInput }],
    },
  });
  await expect.element(page.getByRole('textbox', { name: 'Literal' })).toHaveValue('Original');
  await view.rerender({ uischema: { type: 'VerticalLayout', elements: [] } });
  await expect.element(page.getByRole('textbox', { name: 'Literal' })).not.toBeInTheDocument();
  await view.rerender({ uischema: { type: 'Control', scope: '#/properties/a.b' } });
  await expect.element(page.getByRole('textbox', { name: 'Literal' })).toHaveValue('Original');
});

it('derives literal-property translation keys from the decoded data path', async () => {
  render(JsonForms, {
    props: {
      schema: { type: 'object', properties: { 'a~b~c': { type: 'string', title: 'Fallback' } } },
      uischema: { type: 'Control', scope: '#/properties/a~0b~0c' },
      data: { 'a~b~c': 'value' },
      i18n: {
        translate: ((key: string, fallback?: string) =>
          key === 'a~b~c.label'
            ? 'Translated literal'
            : fallback) as import('@jsonforms/core').Translator,
      },
      renderers: [{ tester: () => 1, renderer: LiteralInput }],
    },
  });
  await expect
    .element(page.getByRole('textbox', { name: 'Translated literal' }))
    .toHaveValue('value');
});
