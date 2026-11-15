import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import JsonForms from '../src/lib/components/JsonForms.svelte';
import type { OwnedErrorStore } from '../src/lib/ownedErrors';
import PendingChoiceCardRenderer from './fixtures/PendingChoiceCardRenderer.svelte';

afterEach(cleanup);

it('does not switch a choice card after host data changes during owned validation', async () => {
  let store!: OwnedErrorStore;
  const onchange = vi.fn();
  const onSelectionSettled = vi.fn();
  const schema = { type: 'string', enum: ['A', 'B', 'C'] };
  const uischema = {
    type: 'Control',
    scope: '#',
    options: {
      format: 'cards',
      capture: (value: OwnedErrorStore) => (store = value),
      onSelectionSettled,
    },
  };
  const renderers = [{ tester: () => 1, renderer: PendingChoiceCardRenderer }];
  const view = await render(JsonForms, {
    props: { schema, uischema, data: 'A', renderers, onchange },
  });
  await vi.waitFor(() => expect(store).toBeDefined());
  const owner = store.createOwner();
  const generation = owner.begin('', true);
  view.container.querySelector('button')!.click();
  await view.rerender({ schema, uischema, data: 'C', renderers, onchange });
  owner.publish(generation, []);
  await vi.waitFor(() => expect(onSelectionSettled).toHaveBeenCalledTimes(1));
  expect(view.container.querySelector('[data-selected]')?.textContent).toBe('2');
  expect(onchange.mock.calls.some(([detail]) => detail.data === 'B')).toBe(false);
  owner.dispose();
});

it('switches once after owned validation settles when the target stays current', async () => {
  let store!: OwnedErrorStore;
  const onchange = vi.fn();
  const onSelectionSettled = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema: { type: 'string', enum: ['A', 'B', 'C'] },
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          format: 'cards',
          capture: (value: OwnedErrorStore) => (store = value),
          onSelectionSettled,
        },
      },
      data: 'A',
      renderers: [{ tester: () => 1, renderer: PendingChoiceCardRenderer }],
      onchange,
    },
  });
  await vi.waitFor(() => expect(store).toBeDefined());
  const owner = store.createOwner();
  const generation = owner.begin('', true);
  view.container.querySelector('button')!.click();
  expect(onchange.mock.calls.some(([detail]) => detail.data === 'B')).toBe(false);
  owner.publish(generation, []);
  await vi.waitFor(() => expect(onSelectionSettled).toHaveBeenCalledTimes(1));
  await vi.waitFor(() =>
    expect(onchange.mock.calls.some(([detail]) => detail.data === 'B')).toBe(true),
  );
  owner.dispose();
});

it('allows a pending field edit to flush before switching choice cards', async () => {
  let setPendingValue!: (value: string) => void;
  const onchange = vi.fn();
  const onSelectionSettled = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema: { type: 'string', enum: ['A', 'B', 'C'] },
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          format: 'cards',
          capturePendingValue: (value: typeof setPendingValue) => (setPendingValue = value),
          onSelectionSettled,
        },
      },
      data: 'A',
      renderers: [{ tester: () => 1, renderer: PendingChoiceCardRenderer }],
      onchange,
    },
  });
  await vi.waitFor(() => expect(setPendingValue).toBeDefined());
  setPendingValue('C');
  view.container.querySelector('button')!.click();
  await vi.waitFor(() => expect(onSelectionSettled).toHaveBeenCalledTimes(1));
  await vi.waitFor(() =>
    expect(onchange.mock.calls.some(([detail]) => detail.data === 'B')).toBe(true),
  );
});
