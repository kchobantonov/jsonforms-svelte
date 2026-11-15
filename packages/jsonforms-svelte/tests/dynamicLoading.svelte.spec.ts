import { beforeEach, expect, it, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
const { load } = vi.hoisted(() => ({ load: vi.fn<() => Promise<void>>() }));
vi.mock('../src/lib/dynamicRuntime', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/lib/dynamicRuntime')>()),
  dynamicUiExpressionsReady: () => false,
  loadDynamicUiExpressions: load,
}));
import JsonForms from '../src/lib/components/JsonForms.svelte';
import DynamicDraft from './fixtures/DynamicDraft.svelte';
let resolve: () => void;
let reject: (error: Error) => void;
beforeEach(() => {
  load.mockReset();
  load.mockImplementation(
    () =>
      new Promise<void>((yes, no) => {
        resolve = yes;
        reject = no;
      }),
  );
});
const config = (enabled: boolean) => ({ jsonformsExtended: { dynamic: { enabled } } });
const props = {
  schema: { type: 'string' },
  data: 'Initial',
  uischema: { type: 'Control', scope: '#' },
  renderers: [{ tester: () => 1, renderer: DynamicDraft }],
};
it('holds initial editors until CEL loads', async () => {
  await render(JsonForms, { props: { ...props, config: config(true) } });
  expect(load).toHaveBeenCalledTimes(1);
  expect(document.querySelector('[data-testid=dynamic-draft]')).toBeNull();
  resolve();
  await tick();
  await expect.poll(() => !!document.querySelector('[data-testid=dynamic-draft]')).toBe(true);
});
it('does not load when disabled and preserves the live draft through loading and disabling', async () => {
  const view = await render(JsonForms, { props: { ...props, config: config(false) } });
  expect(load).not.toHaveBeenCalled();
  const input = document.querySelector<HTMLInputElement>('[data-testid=dynamic-draft]')!;
  input.value = 'Unfinished';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await tick();
  await view.rerender({ config: config(true) });
  expect(document.querySelector('[data-testid=dynamic-draft]')).toBe(input);
  expect(input.closest('[inert]')).not.toBeNull();
  await view.rerender({ config: config(false) });
  resolve();
  await tick();
  expect(input.value).toBe('Unfinished');
  expect(input.closest('[inert]')).toBeNull();
});
it('reports load failure and retries on reactivation', async () => {
  const view = await render(JsonForms, { props: { ...props, config: config(true) } });
  reject(new Error('Chunk unavailable'));
  await tick();
  await expect
    .poll(() => document.querySelector('[role=alert]')?.textContent)
    .toContain('Unable to load');
  expect(document.querySelector('[data-testid=dynamic-draft]')).toBeNull();
  await view.rerender({ config: config(false) });
  await view.rerender({ config: config(true) });
  expect(load).toHaveBeenCalledTimes(2);
  resolve();
  await tick();
  await expect.poll(() => document.querySelector('[inert]')).toBeNull();
});

it('restores focus after loading unless the user moved elsewhere', async () => {
  const view = await render(JsonForms, { props: { ...props, config: config(false) } });
  const input = document.querySelector<HTMLInputElement>('[data-testid=dynamic-draft]')!;
  input.focus();
  await view.rerender({ config: config(true) });
  resolve();
  await tick();
  await expect.poll(() => document.activeElement).toBe(input);
});

it('does not take focus back from outside the pending form', async () => {
  const view = await render(JsonForms, { props: { ...props, config: config(false) } });
  const input = document.querySelector<HTMLInputElement>('[data-testid=dynamic-draft]')!;
  const outside = document.createElement('button');
  document.body.append(outside);
  try {
    input.focus();
    await view.rerender({ config: config(true) });
    outside.focus();
    resolve();
    await tick();
    await expect.poll(() => document.querySelector('[inert]')).toBeNull();
    expect(document.activeElement).toBe(outside);
  } finally {
    outside.remove();
  }
});
