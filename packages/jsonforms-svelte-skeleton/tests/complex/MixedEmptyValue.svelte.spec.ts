import { afterEach, expect, it } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { skeletonRenderers } from '../../src/lib/renderers';
import { mountForm } from '../testUtils';
import '../test.css';

afterEach(cleanup);
it.each(
  [false, true].flatMap((nested) =>
    [false, true].flatMap((typing) =>
      ['string', 'number', 'integer'].map((type) => ({ nested, typing, type })),
    ),
  ),
)(
  'preserves mixed $type when clearing (nested=$nested, typing=$typing)',
  async ({ nested, typing, type }) => {
    const initial = type === 'string' ? 'hello' : type === 'number' ? 3.5 : 3;
    const empty = type === 'string' ? '' : 0;
    const { view, onchange } = await mountForm({
      renderers: skeletonRenderers,
      schema: nested
        ? { type: 'object', properties: { value: {}, sibling: { type: 'string' } } }
        : {},
      data: nested ? { value: initial, sibling: 'keep' } : initial,
      uischema: { type: 'Control', scope: nested ? '#/properties/value' : '#' },
    });
    const current = () =>
      nested ? onchange.mock.lastCall?.[0].data.value : onchange.mock.lastCall?.[0].data;
    const initialInput = [...view.container.querySelectorAll<HTMLInputElement>('input')].find(
      (input) => input.value === String(initial),
    )!;
    initialInput.focus();
    if (typing) {
      const input = [...view.container.querySelectorAll<HTMLInputElement>('input')].find(
        (input) => input.value === String(initial),
      )!;
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    } else await page.getByRole('button', { name: 'Clear value', exact: true }).click();
    await expect.poll(current).toBe(empty);
    if (nested) expect(onchange.mock.lastCall?.[0].data.sibling).toBe('keep');
    if (type !== 'string') {
      // Finish the empty native draft before clearing the displayed numeric default.
      initialInput.blur();
      initialInput.focus();
      await page.getByRole('button', { name: 'Clear value', exact: true }).click();
      await expect
        .poll(() =>
          [...view.container.querySelectorAll<HTMLInputElement>('input')].some(
            (input) => input.value === '0',
          ),
        )
        .toBe(true);
    }
    view.container.querySelector<HTMLElement>('[id$="-input-selector"]')?.focus();
    await page.getByRole('button', { name: 'Clear type', exact: true }).click();
    await expect.poll(current).toBeUndefined();
    if (nested) expect(onchange.mock.lastCall?.[0].data.sibling).toBe('keep');
  },
);
