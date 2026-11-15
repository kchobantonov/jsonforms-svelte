import { afterEach, expect, it, vi } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import { cleanup } from 'vitest-browser-svelte';
import { flowbiteRenderers } from '../../src/lib/renderers';
import { mountControl } from '../testUtils';
import '../test.css';
afterEach(cleanup);
it('edits declared literal keys in the aggregate mixed form without disabling siblings', async () => {
  const original = { 'a.b': 'Literal', '': 'Empty', a: { b: 'Nested' } };
  const { view, onchange } = await mountControl({
    renderers: flowbiteRenderers,
    propertySchema: {
      type: ['object', 'string'],
      properties: {
        'a.b': { type: 'string', title: 'Literal property' },
        '': { type: 'string', title: 'Empty property' },
        a: { type: 'object', properties: { b: { type: 'string', title: 'Nested property' } } },
      },
    },
    value: original,
  });
  const literal = page.getByRole('textbox', { name: 'Literal property', exact: true });
  await expect.element(literal).toBeEnabled();
  await literal.fill('Edited');
  await vi.waitFor(() =>
    expect(onchange.mock.lastCall?.[0].data.value).toEqual({ ...original, 'a.b': 'Edited' }),
  );
  const empty = page.getByRole('textbox', { name: 'Empty property', exact: true });
  await expect.element(empty).toBeEnabled();
  await empty.fill('Changed');
  await vi.waitFor(() =>
    expect(onchange.mock.lastCall?.[0].data.value).toEqual({
      ...original,
      'a.b': 'Edited',
      '': 'Changed',
    }),
  );
  await view.rerender({ readonly: true });
  await expect.element(literal).toBeDisabled();
  expect(original).toEqual({ 'a.b': 'Literal', '': 'Empty', a: { b: 'Nested' } });
});
