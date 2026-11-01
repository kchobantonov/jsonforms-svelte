import { afterEach, expect, it, vi } from 'vite-plus/test';
import { tick } from 'svelte';
import { cleanup, render } from 'vitest-browser-svelte';
import JsonForms from '../src/lib/components/JsonForms.svelte';
import type { OwnedErrorGeneration, OwnedErrorStore } from '../src/lib/ownedErrors';
import PendingActionRenderer from './fixtures/PendingActionRenderer.svelte';

afterEach(cleanup);

async function mountAction() {
  let store!: OwnedErrorStore;
  let setBlocked!: (value: boolean) => void;
  let setCollectionPath!: (value: string) => void;
  let setDeletionData!: (value: string[]) => void;
  let setPendingDeletionEdit!: (value: string[]) => void;
  let setOnFlush!: (callback: () => void) => void;
  const onaction = vi.fn();
  const oncollection = vi.fn();
  const ondelete = vi.fn();
  const onDeleteRequestSettled = vi.fn();
  const view = await render(JsonForms, {
    props: {
      data: 'value',
      schema: { type: 'string' },
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          capture: (value: OwnedErrorStore) => {
            store = value;
          },
          captureBlocked: (value: typeof setBlocked) => {
            setBlocked = value;
          },
          captureCollectionPath: (value: typeof setCollectionPath) => {
            setCollectionPath = value;
          },
          captureDeletionData: (value: typeof setDeletionData) => {
            setDeletionData = value;
          },
          capturePendingDeletionEdit: (value: typeof setPendingDeletionEdit) => {
            setPendingDeletionEdit = value;
          },
          captureOnFlush: (value: typeof setOnFlush) => {
            setOnFlush = value;
          },
          onaction,
          oncollection,
          ondelete,
          onDeleteRequestSettled,
        },
      },
      renderers: [{ tester: () => 1, renderer: PendingActionRenderer }],
    },
  });
  await vi.waitFor(() => expect(store).toBeDefined());
  return {
    view,
    store,
    setBlocked,
    setCollectionPath,
    setDeletionData,
    setPendingDeletionEdit,
    setOnFlush,
    onaction,
    oncollection,
    ondelete,
    onDeleteRequestSettled,
    button: view.container.querySelector('button')!,
    collectionButton: view.container.querySelectorAll('button')[1],
    deleteButton: view.container.querySelectorAll('button')[2],
  };
}

it('dispatches one click after owned validation settles', async () => {
  const { store, onaction, button } = await mountAction();
  const owner = store.createOwner();
  const generation = owner.begin('', true);
  button.click();
  await tick();
  expect(onaction).not.toHaveBeenCalled();
  owner.publish(generation, []);
  await vi.waitFor(() => expect(onaction).toHaveBeenCalledTimes(1));
  owner.dispose();
});

it('keeps a composition-style hard block even while owned validation is pending', async () => {
  const { store, setBlocked, onaction, button } = await mountAction();
  const owner = store.createOwner();
  const generation = owner.begin('', true);
  setBlocked(true);
  button.click();
  await tick();
  expect(onaction).not.toHaveBeenCalled();
  owner.publish(generation, []);
  await tick();
  expect(onaction).not.toHaveBeenCalled();
  setBlocked(false);
  button.click();
  await vi.waitFor(() => expect(onaction).toHaveBeenCalledTimes(1));
  owner.dispose();
});

it('cancels a queued action when its renderer is disposed', async () => {
  const { view, store, onaction, button } = await mountAction();
  const owner = store.createOwner();
  const generation = owner.begin('', true);
  button.click();
  await tick();
  await view.unmount();
  owner.publish(generation, []);
  await tick();
  expect(onaction).not.toHaveBeenCalled();
});

it('runs one collection command after transient validation settles', async () => {
  const { store, oncollection, collectionButton } = await mountAction();
  const owner = store.createOwner();
  const generation = owner.begin('', true);
  collectionButton.click();
  collectionButton.click();
  await tick();
  expect(oncollection).not.toHaveBeenCalled();
  owner.publish(generation, []);
  await vi.waitFor(() => expect(oncollection).toHaveBeenCalledTimes(1));
  owner.dispose();
});

it('drops a waiting collection command when its target changes', async () => {
  const { store, setCollectionPath, oncollection, collectionButton } = await mountAction();
  const owner = store.createOwner();
  const generation = owner.begin('', true);
  collectionButton.click();
  await tick();
  setCollectionPath('replacement');
  owner.publish(generation, []);
  await tick();
  expect(oncollection).not.toHaveBeenCalled();
  owner.dispose();
});

it('opens one delete confirmation after validation settles and deletes only on acceptance', async () => {
  const { view, store, ondelete, deleteButton } = await mountAction();
  const owner = store.createOwner();
  const generation = owner.begin('', true);
  deleteButton.click();
  await tick();
  expect(view.container.textContent).not.toContain('Yes');
  owner.publish(generation, []);
  await vi.waitFor(() => expect(view.container.textContent).toContain('Yes'));
  expect(ondelete).not.toHaveBeenCalled();
  view.container.querySelectorAll('button')[3].click();
  await vi.waitFor(() => expect(ondelete).toHaveBeenCalledTimes(1));
  owner.dispose();
});

it('cancels deletion confirmation if its data changes while validation is pending', async () => {
  const { view, store, setDeletionData, ondelete, onDeleteRequestSettled, deleteButton } =
    await mountAction();
  const owner = store.createOwner();
  const generation = owner.begin('', true);
  deleteButton.click();
  await tick();
  setDeletionData(['replacement']);
  owner.publish(generation, []);
  await vi.waitFor(() => expect(onDeleteRequestSettled).toHaveBeenCalledTimes(1));
  expect(view.container.textContent).not.toContain('Yes');
  expect(ondelete).not.toHaveBeenCalled();
  owner.dispose();
});

it('confirms the updated data after flushing a pending field edit', async () => {
  const { view, setPendingDeletionEdit, ondelete, deleteButton } = await mountAction();
  setPendingDeletionEdit(['edited']);
  deleteButton.click();
  await vi.waitFor(() => expect(view.container.textContent).toContain('Yes'));
  expect(view.container.querySelector('[data-discarded]')?.textContent).toBe('[["edited"]]');
  view.container.querySelectorAll('button')[3].click();
  await vi.waitFor(() => expect(ondelete).toHaveBeenCalledTimes(1));
});

it('drops deletion if the host replaces data during validation started by the flush', async () => {
  const {
    view,
    store,
    setOnFlush,
    setDeletionData,
    onDeleteRequestSettled,
    ondelete,
    deleteButton,
  } = await mountAction();
  const owner = store.createOwner();
  let generation: OwnedErrorGeneration | undefined;
  setOnFlush(() => {
    generation = owner.begin('', true);
  });
  deleteButton.click();
  await vi.waitFor(() => expect(generation).toBeDefined());
  expect(view.container.textContent).not.toContain('Yes');
  setDeletionData(['replacement']);
  owner.publish(generation!, []);
  await vi.waitFor(() => expect(onDeleteRequestSettled).toHaveBeenCalledTimes(1));
  expect(view.container.textContent).not.toContain('Yes');
  expect(ondelete).not.toHaveBeenCalled();
  owner.dispose();
});

it('opens deletion confirmation after validation started by the flush settles unchanged', async () => {
  const { view, store, setOnFlush, onDeleteRequestSettled, deleteButton } = await mountAction();
  const owner = store.createOwner();
  let generation: OwnedErrorGeneration | undefined;
  setOnFlush(() => {
    generation = owner.begin('', true);
  });
  deleteButton.click();
  await vi.waitFor(() => expect(generation).toBeDefined());
  expect(view.container.textContent).not.toContain('Yes');
  owner.publish(generation!, []);
  await vi.waitFor(() => expect(onDeleteRequestSettled).toHaveBeenCalledTimes(1));
  expect(view.container.textContent).toContain('Yes');
  owner.dispose();
});
