import '../test.css';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { mountControl, waitForChange } from '../testUtils';
import { shadcnRenderers } from '../../src/lib/renderers';
afterEach(cleanup);
it.each([
  ['test[0]', 'Original', 'Updated'],
  ['15', 'Numeric', 'Updated'],
  ['test[0]', 'Original', ''],
])(
  'edits or clears nested literal property %s without changing its container',
  async (key, initial, next) => {
    const { view, onchange } = mountControl({
      renderers: shadcnRenderers,
      propertySchema: {
        type: 'object',
        properties: {
          'group[0]': { type: 'object', additionalProperties: { type: 'string' } },
        },
      },
      value: { 'group[0]': { 'test[0]': 'Original', '15': 'Numeric' } },
    });
    const input = Array.from(view.container.querySelectorAll<HTMLInputElement>('input')).find(
      (i) => i.value === initial,
    )!;
    expect(input).toBeTruthy();
    const before = onchange.mock.calls.length;
    input.value = next;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect((await waitForChange(onchange, before)).data.value).toEqual({
      'group[0]': { 'test[0]': 'Original', '15': 'Numeric', [key]: next },
    });
  },
);
it('allows adding a bracketed property name', async () => {
  const { view, onchange } = mountControl({
    renderers: shadcnRenderers,
    propertySchema: { type: 'object', additionalProperties: { type: 'string' } },
    value: {},
  });
  const input = view.container.querySelector<HTMLInputElement>('input')!;
  input.value = 'test[0]';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  const add = view.container.querySelector<HTMLButtonElement>('button[aria-label*="Add"]')!;
  await vi.waitFor(() => expect(add.disabled).toBe(false));
  const before = onchange.mock.calls.length;
  add.click();
  expect((await waitForChange(onchange, before)).data.value).toEqual({ 'test[0]': '' });
});

it('renames a bracketed property to another bracketed name without changing its value', async () => {
  const { view, onchange } = mountControl({
    renderers: shadcnRenderers,
    propertySchema: { type: 'object', additionalProperties: { type: 'string' } },
    value: { 'old[0]': 'Ada' },
  });
  view.container.querySelector<HTMLButtonElement>('button[aria-label="Rename button"]')!.click();
  await vi.waitFor(() => expect(document.querySelector('#shadcn-rename-property')).toBeTruthy());
  const input = document.querySelector<HTMLInputElement>('#shadcn-rename-property')!;
  input.value = 'new[1]';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  const submit = document.querySelector<HTMLButtonElement>('form button[type="submit"]')!;
  await vi.waitFor(() => expect(submit.disabled).toBe(false));
  const before = onchange.mock.calls.length;
  submit.click();
  expect((await waitForChange(onchange, before)).data.value).toEqual({ 'new[1]': 'Ada' });
});
