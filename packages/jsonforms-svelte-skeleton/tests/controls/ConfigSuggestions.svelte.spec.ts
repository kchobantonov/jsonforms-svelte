import '../test.css';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { skeletonRenderers } from '../../src/lib/renderers';

afterEach(cleanup);

it('replaces flat suggestions with the local array', async () => {
  const view = await render(JsonForms, {
    props: {
      schema: { type: 'string' },
      data: '',
      uischema: { type: 'Control', scope: '#', options: { suggestion: ['Plovdiv'] } },
      config: { suggestion: ['Sofia', 'Varna'] },
      renderers: skeletonRenderers,
    },
  });
  await vi.waitFor(() =>
    expect(
      Array.from(view.container.querySelectorAll('datalist option')).map((option) =>
        option.getAttribute('value'),
      ),
    ).toEqual(['Plovdiv']),
  );
});

it('lets an explicit empty local array clear global suggestions', async () => {
  const view = await render(JsonForms, {
    props: {
      schema: { type: 'string' },
      data: '',
      uischema: { type: 'Control', scope: '#', options: { suggestion: [] } },
      config: { suggestion: ['Sofia', 'Varna'] },
      renderers: skeletonRenderers,
    },
  });
  expect(view.container.querySelectorAll('datalist option')).toHaveLength(0);
});

it('keeps suggestions advisory and accepts other schema-valid text', async () => {
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema: { type: 'string' },
      data: '',
      uischema: { type: 'Control', scope: '#', options: { suggestion: ['Sofia'] } },
      renderers: skeletonRenderers,
      onchange,
    },
  });
  const input = view.container.querySelector<HTMLInputElement>('input[id$="-input"]')!;
  input.value = 'Atlantis';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toBe('Atlantis'));
});
