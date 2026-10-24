import { Actions, type CoreActions, type JsonFormsSubStates } from '@jsonforms/core';
import type { ErrorObject } from 'ajv';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import JsonForms from '../src/lib/components/JsonForms.svelte';
import { type JsonFormsValidityEvent, type OwnedErrorStore } from '../src/lib/ownedErrors';
import OwnedErrorRenderer from './fixtures/OwnedErrorRenderer.svelte';

afterEach(cleanup);
const error = (message: string): ErrorObject => ({
  keyword: 'editor',
  instancePath: '',
  schemaPath: '',
  params: {},
  message,
});

it('merges publication with current edited data and preserves owner errors across host replacement', async () => {
  let context: {
    store: OwnedErrorStore;
    dispatch: (action: CoreActions) => void;
    jsonforms: JsonFormsSubStates;
  };
  const validity = vi.fn<(event: JsonFormsValidityEvent) => void>();
  const changes = vi.fn();
  const view = await render(JsonForms, {
    props: {
      data: 'original',
      schema: { type: 'string' },
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          capture: (value: typeof context) => {
            context = value;
          },
        },
      },
      renderers: [{ tester: () => 1, renderer: OwnedErrorRenderer }],
      additionalErrors: [error('server')],
      onchange: changes,
      onvaliditychange: validity,
    },
  });
  await vi.waitFor(() => expect(context!.store).toBeDefined());
  const owner = context!.store.createOwner();
  const generation = owner.begin('');
  context!.dispatch(Actions.update('', () => 'edited'));
  owner.publish(generation, [error('draft')]);
  await vi.waitFor(() => expect(validity.mock.lastCall?.[0].additionalErrors).toHaveLength(2));
  expect(context!.jsonforms.core?.data).toBe('edited');
  expect(changes.mock.lastCall?.[0].data).toBe('edited');
  expect(changes.mock.lastCall?.[0].errors).toEqual([]);
  await view.rerender({ additionalErrors: [error('replacement server')] });
  await vi.waitFor(() =>
    expect(validity.mock.lastCall?.[0].additionalErrors.map((entry) => entry.message)).toEqual([
      'replacement server',
      'draft',
    ]),
  );
  owner.dispose();
  await vi.waitFor(() =>
    expect(validity.mock.lastCall?.[0].additionalErrors.map((entry) => entry.message)).toEqual([
      'replacement server',
    ]),
  );
  expect(context!.jsonforms.core?.data).toBe('edited');
});

it('notifies pending and errors without data edits, including hidden validation modes', async () => {
  let store: OwnedErrorStore;
  const validity = vi.fn<(event: JsonFormsValidityEvent) => void>();
  const view = await render(JsonForms, {
    props: {
      data: 'value',
      schema: { type: 'string' },
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          capture: (value: { store: OwnedErrorStore }) => {
            store = value.store;
          },
        },
      },
      renderers: [{ tester: () => 1, renderer: OwnedErrorRenderer }],
      onvaliditychange: validity,
    },
  });
  await vi.waitFor(() => expect(validity.mock.lastCall?.[0].valid).toBe(true));
  const owner = store!.createOwner();
  const generation = owner.begin('', true);
  await vi.waitFor(() =>
    expect(validity.mock.lastCall?.[0]).toMatchObject({ pending: true, valid: false }),
  );
  owner.publish(generation, [error('draft')]);
  await vi.waitFor(() =>
    expect(validity.mock.lastCall?.[0]).toMatchObject({ pending: false, valid: false }),
  );
  await view.rerender({ validationMode: 'NoValidation' });
  expect(validity.mock.lastCall?.[0].valid).toBe(false);
  owner.clear();
  await vi.waitFor(() => expect(validity.mock.lastCall?.[0].valid).toBe(true));
});

it('keeps hidden schema errors in combined validity and preserves host errors in NoValidation', async () => {
  const validity = vi.fn<(event: JsonFormsValidityEvent) => void>();
  const view = await render(JsonForms, {
    props: {
      data: '',
      schema: { type: 'string', minLength: 2 },
      uischema: { type: 'Control', scope: '#' },
      renderers: [],
      validationMode: 'ValidateAndHide',
      onvaliditychange: validity,
    },
  });
  await vi.waitFor(() =>
    expect(validity.mock.lastCall?.[0]).toMatchObject({ valid: false, pending: false }),
  );
  expect(validity.mock.lastCall?.[0].errors).toHaveLength(1);
  await view.rerender({ validationMode: 'NoValidation' });
  await vi.waitFor(() => expect(validity.mock.lastCall?.[0].valid).toBe(true));
  await view.rerender({ additionalErrors: [error('server')] });
  await vi.waitFor(() => expect(validity.mock.lastCall?.[0].valid).toBe(false));
  expect(validity.mock.lastCall?.[0].errors).toEqual([]);
  expect(validity.mock.lastCall?.[0].additionalErrors).toHaveLength(1);
});
