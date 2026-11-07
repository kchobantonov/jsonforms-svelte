import vectors from '../../../tests/fixtures/spec-conformance/behavior.json';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import { Actions, type CoreActions, type JsonFormsSubStates } from '@jsonforms/core';
import JsonForms from '../src/lib/components/JsonForms.svelte';
import type { useDetailDialog } from '../src/lib/detailDialog.svelte';
import type { OwnedErrorGeneration, OwnedErrorStore } from '../src/lib/ownedErrors';
import DraftDialogHarness from './fixtures/DraftDialogHarness.svelte';

afterEach(cleanup);

it('forwards focus conflicts in an isolated draft through the owning form callback', async () => {
  let editor!: ReturnType<typeof useDetailDialog>;
  const ondiagnostic = vi.fn();
  const onchange = vi.fn();
  await render(JsonForms, {
    props: {
      schema: { type: 'object', properties: { value: { type: 'object' } } },
      data: { value: {} },
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          capture: (value: typeof editor) => (editor = value),
          captureDraft: () => {},
          focusRequests: true,
        },
      },
      renderers: [{ tester: () => 1, renderer: DraftDialogHarness }],
      ondiagnostic,
      onchange,
    },
  });
  await vi.waitFor(() => expect(editor).toBeDefined());
  editor.begin();
  await vi.waitFor(() =>
    expect(ondiagnostic).toHaveBeenCalledWith({
      code: 'focus.conflict',
      severity: 'warning',
      message: 'Several active controls request initial focus; the winner is not portable.',
      details: { paths: ['value.first', 'value.second'] },
    }),
  );
  expect(ondiagnostic).toHaveBeenCalledTimes(1);
  editor.cancel();
  await tick();
  editor.begin();
  await vi.waitFor(() => expect(ondiagnostic).toHaveBeenCalledTimes(2));
  expect(onchange.mock.lastCall?.[0].data).toEqual({ value: {} });
});

it('waits for validation started by a draft flush before applying', async () => {
  let editor!: ReturnType<typeof useDetailDialog>;
  let draft!: {
    store: OwnedErrorStore;
    dispatch: (action: CoreActions) => void;
    setFlush: (callback: () => void) => void;
  };
  const onchange = vi.fn();
  const props = {
    schema: {
      type: 'object',
      properties: { value: { type: 'object', properties: { name: { type: 'string' } } } },
    },
    data: { value: {} },
    uischema: {
      type: 'Control',
      scope: '#',
      options: {
        capture: (value: typeof editor) => (editor = value),
        captureDraft: (value: typeof draft) => (draft = value),
      },
    },
    renderers: [{ tester: () => 1, renderer: DraftDialogHarness }],
    onchange,
  };
  const view = await render(JsonForms, { props });
  await vi.waitFor(() => expect(editor).toBeDefined());
  editor.begin();
  await vi.waitFor(() => expect(draft).toBeDefined());
  const owner = draft.store.createOwner();
  let generation: OwnedErrorGeneration | undefined;
  draft.setFlush(() => {
    draft.dispatch(Actions.update('value.name', () => 'Ada'));
    generation = owner.begin('/value', true);
  });
  const before = onchange.mock.calls.length;
  const applying = editor.apply();
  await vi.waitFor(() => expect(generation).toBeDefined());
  expect(editor.canApply).toBe(false);
  expect(await editor.apply()).toBe(false);
  expect(onchange.mock.calls).toHaveLength(before);
  owner.publish(generation!, []);
  expect(await applying).toBe(true);
  await vi.waitFor(() =>
    expect(onchange.mock.lastCall?.[0].data).toEqual({ value: { name: 'Ada' } }),
  );

  editor.begin();
  await vi.waitFor(() => expect(draft).toBeDefined());
  const nextOwner = draft.store.createOwner();
  let nextGeneration: OwnedErrorGeneration | undefined;
  draft.setFlush(() => {
    draft.dispatch(Actions.update('value.name', () => 'Stale'));
    nextGeneration = nextOwner.begin('/value', true);
  });
  const staleApply = editor.apply();
  await vi.waitFor(() => expect(nextGeneration).toBeDefined());
  await view.rerender({ data: { value: { name: 'External' } } });
  nextOwner.publish(nextGeneration!, []);
  expect(await staleApply).toBe(false);
  expect(onchange.mock.lastCall?.[0].data).toEqual({ value: { name: 'External' } });
});

it('isolates draft errors and gates Apply on pending or unparsed edits without gating schema validity', async () => {
  let editor!: ReturnType<typeof useDetailDialog>;
  let draft!: {
    store: OwnedErrorStore;
    dispatch: (action: CoreActions) => void;
    form: JsonFormsSubStates;
    setBlocked: (value: boolean) => void;
  };
  const onchange = vi.fn();
  const validity = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'object',
        properties: {
          value: { type: 'object', required: ['name'], properties: { name: { type: 'string' } } },
        },
      },
      data: { value: {} },
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          capture: (value: typeof editor) => {
            editor = value;
          },
          captureDraft: (value: typeof draft) => {
            draft = value;
          },
        },
      },
      renderers: [{ tester: () => 1, renderer: DraftDialogHarness }],
      onchange,
      onvaliditychange: validity,
    },
  });
  await vi.waitFor(() => expect(editor).toBeDefined());
  editor.begin();
  await vi.waitFor(() => expect(draft).toBeDefined());
  expect(editor.canApply).toBe(true);
  const owner = draft.store.createOwner();
  const generation = owner.begin('/value', true);
  await tick();
  expect(editor.canApply).toBe(false);
  const pendingApply = editor.apply();
  expect(validity.mock.lastCall?.[0].pending).toBe(false);
  owner.publish(generation, [
    { keyword: 'editor', instancePath: '', schemaPath: '', params: {}, message: 'Invalid draft' },
  ]);
  expect(await pendingApply).toBe(false);
  await tick();
  expect(draft.form.core?.additionalErrors?.[0].message).toBe('Invalid draft');
  expect(validity.mock.lastCall?.[0].additionalErrors).toEqual([]);
  owner.clear();
  draft.setBlocked(true);
  await tick();
  expect(view.container.querySelector('button')?.disabled).toBe(true);
  expect(await editor.apply()).toBe(false);
  draft.setBlocked(false);
  draft.dispatch(Actions.update('value.name', () => 'Ada'));
  await tick();
  expect(await editor.apply()).toBe(true);
  await vi.waitFor(() =>
    expect(onchange.mock.lastCall?.[0].data).toEqual({ value: { name: 'Ada' } }),
  );
  expect(owner.publish(generation, [])).toBe(false);
  await tick();
  editor.begin();
  await tick();
  const lateOwner = draft.store.createOwner();
  const lateGeneration = lateOwner.begin('/value', true);
  const beforeCancel = onchange.mock.calls.length;
  editor.cancel();
  expect(lateOwner.publish(lateGeneration, [])).toBe(false);
  await tick();
  expect(onchange.mock.calls.length).toBe(beforeCancel);
  editor.begin();
  await tick();
  expect(editor.canApply).toBe(true);
  await view.rerender({ data: { value: { name: 'External' } } });
  await tick();
  expect(await editor.apply()).toBe(false);
  expect(editor.active).toBe(true);
  editor.cancel();
});

it('canonical dialog-cancel', async () => {
  const { input, expected } = vectors.find((vector) => vector.id === 'dialog-cancel')!;
  let editor!: ReturnType<typeof useDetailDialog>;
  let draft!: { dispatch: (action: CoreActions) => void; form: JsonFormsSubStates };
  const onchange = vi.fn();
  await render(JsonForms, {
    props: {
      schema: {
        type: 'object',
        properties: { value: { type: 'object', properties: { city: { type: 'string' } } } },
      },
      data: { value: input.data },
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          capture: (value: typeof editor) => {
            editor = value;
          },
          captureDraft: (value: typeof draft) => {
            draft = value;
          },
        },
      },
      renderers: [{ tester: () => 1, renderer: DraftDialogHarness }],
      onchange,
    },
  });
  await vi.waitFor(() => expect(editor).toBeDefined());
  const before = onchange.mock.calls.length;
  editor.begin();
  await vi.waitFor(() => expect(draft).toBeDefined());
  const edit = input.actions!.find((action) => typeof action === 'object' && 'edit' in action) as {
    edit: { city: string };
  };
  draft.dispatch(Actions.update('value.city', () => edit.edit.city));
  await tick();
  expect(draft.form.core?.data.value.city).toBe(edit.edit.city);
  editor.cancel();
  await tick();
  expect(onchange.mock.lastCall?.[0].data.value).toEqual(expected.data);
  expect(onchange.mock.calls.slice(before)).toHaveLength(expected.changes!);
});
