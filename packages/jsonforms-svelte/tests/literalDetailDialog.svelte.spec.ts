import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';
import JsonForms from '../src/lib/components/JsonForms.svelte';
import LiteralDetailDialog from './fixtures/LiteralDetailDialog.svelte';
import type { useJsonForms } from '../src/lib/jsonFormsCompositions.svelte';
import type { useDetailDialog } from '../src/lib/detailDialog.svelte';
afterEach(cleanup);
it('roots literal controls and dialog drafts at their selected value', async () => {
  let capture: {
    form: NonNullable<ReturnType<typeof useJsonForms>>;
    parent: NonNullable<ReturnType<typeof useJsonForms>>;
    editor: ReturnType<typeof useDetailDialog>;
    edit(name: string): void;
  };
  const data = { 'a.b': { name: 'Original' }, sibling: 'Before' };
  const onchange = vi.fn();
  const view = render(JsonForms, {
    props: {
      data,
      schema: {
        type: 'object',
        required: ['a.b'],
        properties: {
          'a.b': { type: 'object', properties: { name: { type: 'string', minLength: 2 } } },
          sibling: { type: 'string' },
        },
      },
      uischema: {
        type: 'Control',
        scope: '#/properties/a.b',
        options: {
          capture: (value: typeof capture) => {
            capture = value;
          },
        },
      },
      renderers: [{ tester: () => 100, renderer: LiteralDetailDialog }],
      onchange,
    },
  });
  expect(capture!.parent.core?.data).toEqual(data['a.b']);
  capture!.editor.begin();
  capture!.edit('X');
  await vi.waitFor(() =>
    expect(capture!.form.core?.errors).toMatchObject([
      { instancePath: '/name', keyword: 'minLength' },
    ]),
  );
  expect(capture!.parent.core?.errors).toEqual([]);
  capture!.edit('Draft');
  await vi.waitFor(() => expect(capture!.form.core?.data).toEqual({ name: 'Draft' }));
  expect(capture!.parent.core?.data).toEqual(data['a.b']);
  expect(capture!.form.core?.errors).toEqual([]);
  await view.rerender({ data: { ...data, sibling: 'External' } });
  await vi.waitFor(() => expect(capture!.parent.core?.data).toEqual(data['a.b']));
  expect(capture!.form.core?.data).toEqual({ name: 'Draft' });
  expect(capture!.editor.apply()).toBe(true);
  await vi.waitFor(() =>
    expect(onchange.mock.lastCall?.[0].data).toEqual({
      'a.b': { name: 'Draft' },
      sibling: 'External',
    }),
  );
  expect(capture!.form.core?.data).toEqual(capture!.parent.core?.data);
  capture!.editor.begin();
  capture!.edit('Cancelled');
  capture!.editor.cancel();
  expect(capture!.form.core?.data).toEqual({ name: 'Draft' });
});
