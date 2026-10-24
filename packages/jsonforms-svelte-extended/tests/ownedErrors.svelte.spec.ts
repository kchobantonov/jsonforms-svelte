import type { JsonFormsSubStates } from '@jsonforms/core';
import type { OwnedErrorStore, JsonFormsValidityEvent } from '@chobantonov/jsonforms-svelte';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';
import JsonForms from '../src/lib/components/JsonForms.svelte';
import type { FormContext } from '../src/lib/core/types';
import OwnedErrorRenderer from './fixtures/OwnedErrorRenderer.svelte';

afterEach(cleanup);

it('forwards combined validity and exposes merged owned errors in action context', async () => {
  let captured: { store: OwnedErrorStore; context: FormContext; jsonforms: JsonFormsSubStates };
  const validity = vi.fn<(event: JsonFormsValidityEvent) => void>();
  const view = await render(JsonForms, {
    props: {
      schema: { type: 'string' },
      data: 'initial',
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          capture: (value: typeof captured) => {
            captured = value;
          },
        },
      },
      renderers: [{ tester: () => 1, renderer: OwnedErrorRenderer }],
      onvaliditychange: validity,
    },
  });
  await vi.waitFor(() => expect(validity.mock.lastCall?.[0].valid).toBe(true));
  captured!.context.data = 'edited';
  const owner = captured!.store.createOwner();
  owner.publish(owner.begin(''), [
    { keyword: 'editor', instancePath: '', schemaPath: '', params: {}, message: 'Draft error' },
  ]);
  await vi.waitFor(() => expect(captured!.context.additionalErrors).toHaveLength(1));
  expect(validity.mock.lastCall?.[0].valid).toBe(false);
  await view.rerender({
    additionalErrors: [
      { keyword: 'server', instancePath: '', schemaPath: '', params: {}, message: 'Server error' },
    ],
  });
  await vi.waitFor(() => expect(captured!.context.additionalErrors).toHaveLength(2));
  expect(captured!.context.data).toBe('edited');
  expect(captured!.jsonforms.core?.data).toBe('edited');
  owner.dispose();
  await vi.waitFor(() =>
    expect(captured!.context.additionalErrors?.map((error) => error.message)).toEqual([
      'Server error',
    ]),
  );
});
