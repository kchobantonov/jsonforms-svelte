import { afterEach, expect, it } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import RowDetailSourceHost from './fixtures/RowDetailSourceHost.svelte';

afterEach(cleanup);

it('keeps the selected source item with its row key after reorder and replacement', async () => {
  const view = await render(RowDetailSourceHost, {
    props: {
      rows: [{ name: 'First' }, { name: 'Second' }],
      keys: ['first', 'second'],
    },
  });
  const selected = () =>
    view.container.querySelector('[data-testid="selected-source"]')?.textContent;
  await view.getByRole('button', { name: 'Select second row' }).click();
  await expect.poll(selected).toBe('Second');
  await view.rerender({
    rows: [{ name: 'Second updated' }, { name: 'First' }],
    keys: ['second', 'first'],
  });
  await expect.poll(selected).toBe('Second updated');
  await view.rerender({ rows: [{ name: 'First' }], keys: ['first'] });
  await expect.poll(selected).toBe('');
});
