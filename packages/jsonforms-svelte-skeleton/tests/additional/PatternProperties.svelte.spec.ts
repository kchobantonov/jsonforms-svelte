import '../test.css';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { mountControl, waitForChange } from '../testUtils';
import { skeletonRenderers } from '../../src/lib/renderers';
afterEach(cleanup);

it.each([true, false, { type: 'string' }])(
  'applies every matching pattern instead of the additional schema %j',
  async (additionalProperties) => {
    for (const reverse of [false, true]) {
      const entries: [string, object][] = [
        ['^price_', { type: 'number', minimum: 0 }],
        ['_total$', { maximum: 1000 }],
      ];
      const { view, onchange } = mountControl({
        renderers: skeletonRenderers,
        propertySchema: {
          type: 'object',
          patternProperties: Object.fromEntries(reverse ? entries.reverse() : entries),
          additionalProperties,
        },
        options: { restrict: true },
        value: { price_total: 500 },
      });
      const input = view.container.querySelector<HTMLInputElement>('input[type="number"]')!;
      expect(input).toBeTruthy();
      expect(input.min).toBe('0');
      expect(input.max).toBe('1000');
      const before = onchange.mock.calls.length;
      input.value = '1001';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const change = await waitForChange(onchange, before);
      expect(change.data.value).toEqual({ price_total: 1001 });
      expect(change.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ keyword: 'maximum', instancePath: '/value/price_total' }),
        ]),
      );
      cleanup();
    }
  },
);

it('reselects matching constraints on rename without converting the value', async () => {
  const { view, onchange } = mountControl({
    renderers: skeletonRenderers,
    propertySchema: {
      type: 'object',
      patternProperties: {
        '^price_': { type: 'number', minimum: 0 },
        _total$: { maximum: 1000 },
      },
      additionalProperties: true,
    },
    options: { restrict: true },
    value: { price_unit: 1500 },
  });
  expect(view.container.querySelector<HTMLInputElement>('input[type="number"]')!.max).toBe('');
  view.container.querySelector<HTMLButtonElement>('button[aria-label="Rename button"]')!.click();
  await vi.waitFor(() => expect(document.querySelector('#skeleton-rename-property')).toBeTruthy());
  const name = document.querySelector<HTMLInputElement>('#skeleton-rename-property')!;
  name.value = 'price_total';
  name.dispatchEvent(new Event('input', { bubbles: true }));
  const submit = document.querySelector<HTMLButtonElement>('form button[type="submit"]')!;
  await vi.waitFor(() => expect(submit.disabled).toBe(false));
  const before = onchange.mock.calls.length;
  submit.click();
  const change = await waitForChange(onchange, before);
  expect(change.data.value).toEqual({ price_total: 1500 });
  expect(change.errors).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ keyword: 'maximum', instancePath: '/value/price_total' }),
    ]),
  );
  await vi.waitFor(() =>
    expect(view.container.querySelector<HTMLInputElement>('input[type="number"]')!.max).toBe(
      '1000',
    ),
  );
});

it('preserves incompatible incoming data and reports both applicable constraints', async () => {
  const { onchange } = mountControl({
    renderers: skeletonRenderers,
    propertySchema: {
      type: 'object',
      patternProperties: {
        '^price_': { type: 'number', minimum: 0 },
        _total$: { type: 'string', minLength: 2 },
      },
      additionalProperties: true,
    },
    value: { price_total: -1 },
  });
  await vi.waitFor(() => expect(onchange).toHaveBeenCalled());
  for (const [change] of onchange.mock.calls) {
    expect(change.data.value).toEqual({ price_total: -1 });
  }
  expect(onchange.mock.calls.at(-1)![0].errors).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ keyword: 'minimum', instancePath: '/value/price_total' }),
      expect.objectContaining({ keyword: 'type', instancePath: '/value/price_total' }),
    ]),
  );
});
