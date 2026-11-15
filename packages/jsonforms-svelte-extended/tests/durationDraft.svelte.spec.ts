import { JsonForms, type JsonFormsValidityEvent } from '@chobantonov/jsonforms-svelte';
import type { JsonFormsSubStates } from '@jsonforms/core';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import DurationDraftRenderer from './fixtures/DurationDraftRenderer.svelte';
import type { useDurationDraft } from '../src/lib/core/durationDraft.svelte';
afterEach(cleanup);
async function mount(data = 'P1D', showActions = true) {
  let captured: { draft: ReturnType<typeof useDurationDraft>; jsonforms: JsonFormsSubStates };
  const validity = vi.fn<(event: JsonFormsValidityEvent) => void>();
  const view = await render(JsonForms, {
    props: {
      data,
      schema: { type: 'string' },
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          showActions,
          capture: (value: typeof captured) => {
            captured = value;
          },
        },
      },
      renderers: [{ tester: () => 100, renderer: DurationDraftRenderer }],
      onvaliditychange: validity,
    },
  });
  return {
    view,
    validity,
    get state() {
      return captured!;
    },
  };
}
it('keeps incomplete text local, publishes pending validity without errors, and commits exact spelling', async () => {
  const test = await mount();
  test.state.draft.update('P1DT');
  await vi.waitFor(() => expect(test.validity.mock.lastCall?.[0].pending).toBe(true));
  expect(test.state.jsonforms.core?.data).toBe('P1D');
  expect(test.state.draft.text).toBe('P1DT');
  expect(test.validity.mock.lastCall?.[0].additionalErrors).toEqual([]);
  test.state.draft.update('P001DT90M');
  await vi.waitFor(() => expect(test.state.jsonforms.core?.data).toBe('P001DT90M'));
  expect(test.validity.mock.lastCall?.[0].pending).toBe(false);
  test.state.draft.update('P-');
  await test.view.rerender({ data: 'P18M' });
  await vi.waitFor(() => expect(test.state.draft.text).toBe('P18M'));
  expect(test.state.draft.invalidText).toBe(false);
});
it('preserves zero weeks on confirmation and rejects incomplete or rounded picker quantities', async () => {
  const test = await mount('P0W');
  const draft = test.state.draft;
  draft.open = true;
  expect(draft.mode).toBe('weeks');
  draft.confirm();
  expect(test.state.jsonforms.core?.data).toBe('P0W');
  draft.open = true;
  draft.updateField('weeks', '1.9');
  draft.confirm();
  expect(draft.open).toBe(true);
  expect(test.state.jsonforms.core?.data).toBe('P0W');
  await vi.waitFor(() => expect(test.validity.mock.lastCall?.[0].pending).toBe(true));
  draft.cancel();
  await vi.waitFor(() => expect(test.validity.mock.lastCall?.[0].pending).toBe(false));
  draft.open = true;
  draft.setMode('components');
  draft.add('minutes');
  draft.updateField('minutes', '90');
  draft.remove('hours');
  draft.remove('minutes');
  expect(draft.active).toEqual(['minutes']);
  draft.confirm();
  await vi.waitFor(() => expect(test.state.jsonforms.core?.data).toBe('PT90M'));
});
it('retains an empty numeric draft in immediate mode and clears it on readonly transitions', async () => {
  const test = await mount('PT90M', false);
  const draft = test.state.draft;
  draft.open = true;
  expect(draft.active).toEqual(['minutes']);
  draft.updateField('minutes', '');
  await vi.waitFor(() => expect(test.validity.mock.lastCall?.[0].pending).toBe(true));
  expect(test.state.jsonforms.core?.data).toBe('PT90M');
  await test.view.rerender({ readonly: true });
  await vi.waitFor(() => expect(draft.open).toBe(false));
  expect(test.validity.mock.lastCall?.[0].pending).toBe(false);
  draft.update('P2D');
  expect(test.state.jsonforms.core?.data).toBe('PT90M');
});

it.each(['text', 'picker'] as const)(
  'clears a pending %s draft when the host returns to a previously committed value',
  async (kind) => {
    const test = await mount();
    const draft = test.state.draft;
    draft.update('P2D');
    await vi.waitFor(() => expect(test.state.jsonforms.core?.data).toBe('P2D'));
    await test.view.rerender({ data: 'P3D' });
    await vi.waitFor(() => expect(draft.text).toBe('P3D'));
    if (kind === 'text') draft.update('P-');
    else {
      draft.open = true;
      draft.updateField('days', '');
    }
    await vi.waitFor(() => expect(test.validity.mock.lastCall?.[0].pending).toBe(true));
    await test.view.rerender({ data: 'P2D' });
    await vi.waitFor(() => {
      expect(draft.text).toBe('P2D');
      expect(draft.open).toBe(false);
      expect(draft.invalidText).toBe(false);
      expect(draft.invalidFields).toBe(false);
      expect(test.validity.mock.lastCall?.[0].pending).toBe(false);
    });
  },
);

it('retains a newer incomplete draft while its own earlier commit is acknowledged', async () => {
  const test = await mount();
  test.state.draft.update('P2D');
  test.state.draft.update('P-');
  await vi.waitFor(() => expect(test.state.jsonforms.core?.data).toBe('P2D'));
  expect(test.state.draft.text).toBe('P-');
  await vi.waitFor(() => expect(test.validity.mock.lastCall?.[0].pending).toBe(true));
  await test.view.rerender({ data: 'P3D' });
  await vi.waitFor(() => expect(test.state.draft.text).toBe('P3D'));
  expect(test.validity.mock.lastCall?.[0].pending).toBe(false);
});
