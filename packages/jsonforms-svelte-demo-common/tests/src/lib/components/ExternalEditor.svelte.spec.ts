import { afterEach, expect, it, vi } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import { cleanup, render } from 'vitest-browser-svelte';
import TestEditor from './ExternalTestEditor.svelte';
import ExternalEditor from '../../../../src/lib/components/ExternalEditor.svelte';

afterEach(cleanup);
it('applies valid external objects and retains invalid drafts without publishing them', async () => {
  const onchange = vi.fn();
  const view = await render(ExternalEditor, {
    props: {
      editor: TestEditor,
      value: '{"settings":{}}',
      onchange,
      label: 'External',
      hint: 'Host state',
      invalid: 'Invalid external JSON',
    },
  });
  const editor = page.getByRole('textbox', { name: 'External', exact: true });
  await editor.fill('{"settings":{"readonly":true},"host":{"name":"A"}}');
  expect(onchange).toHaveBeenLastCalledWith({ settings: { readonly: true }, host: { name: 'A' } });
  onchange.mockClear();
  await editor.fill('{');
  await expect.element(page.getByRole('alert')).toHaveTextContent('Invalid external JSON');
  expect(onchange).not.toHaveBeenCalled();
  await editor.fill('{"settings":[]}');
  expect(onchange).not.toHaveBeenCalled();
  await view.rerender({ value: '{"settings":{"readonly":false},"host":{"name":"A"}}' });
  await expect.element(editor).toHaveValue('{"settings":{"readonly":false},"host":{"name":"A"}}');
  await expect.element(page.getByRole('alert')).not.toBeInTheDocument();
});
