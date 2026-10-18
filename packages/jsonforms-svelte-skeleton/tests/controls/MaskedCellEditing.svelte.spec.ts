import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';
import { skeletonRenderers, skeletonCells } from '../../src/lib';

afterEach(cleanup);
it('keeps masked cell composition pending, commits stored digits and preserves neighboring values', async () => {
  const onchange = vi.fn();
  const onvaliditychange = vi.fn();
  const view = render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: { code: { type: 'string', maxLength: 6 }, other: { type: 'string' } },
        },
      },
      data: [
        { code: '12', other: 'keep' },
        { code: '34', other: 'second' },
      ],
      uischema: {
        type: 'Control',
        scope: '#',
        options: { table: true, cells: { code: { mask: '###-###' } } },
      },
      config: { restrict: true, separateReadonlyFromDisabled: true },
      renderers: skeletonRenderers,
      cells: skeletonCells,
      onchange,
      onvaliditychange,
    },
  });
  const input = view.container.querySelector<HTMLInputElement>('tbody input[type="text"]')!;
  await vi.waitFor(() => expect(onchange).toHaveBeenCalled());
  input.focus();
  input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
  input.value = '123456';
  input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
  await vi.waitFor(() => expect(onvaliditychange.mock.lastCall?.[0].pending).toBe(true));
  expect(onchange.mock.lastCall?.[0].data[0].code).toBe('12');
  input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
  await vi.waitFor(() =>
    expect(onchange.mock.lastCall?.[0].data).toEqual([
      { code: '123456', other: 'keep' },
      { code: '34', other: 'second' },
    ]),
  );
  expect(input.value).toBe('123-456');
  await vi.waitFor(() => expect(onvaliditychange.mock.lastCall?.[0].pending).toBe(false));
  await view.rerender({ readonly: true });
  expect(input.readOnly).toBe(true);
  expect(input.disabled).toBe(false);
  input.value = '987654';
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  expect(onchange.mock.lastCall?.[0].data[0].code).toBe('123456');
});
