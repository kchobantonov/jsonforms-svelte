import '../test.css';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { mountControl } from '../testUtils';
import { shadcnRenderers } from '../../src/lib/renderers';
import { buildTreeFromData } from '../../src/lib/complex/util/treeBuilder.svelte';
vi.mock('../../src/lib/complex/util/treeBuilder.svelte', async (original) => {
  const module = await original<typeof import('../../src/lib/complex/util/treeBuilder.svelte')>();
  return { ...module, buildTreeFromData: vi.fn(module.buildTreeFromData) };
});
afterEach(cleanup);
it('skips unrelated data updates but rebuilds for an edit inside the tree', async () => {
  const value = { customer: 'Ada' };
  const { view } = mountControl({
    renderers: shadcnRenderers,
    propertySchema: { type: ['object', 'string'] },
    value,
  });
  await vi.waitFor(() => expect(vi.mocked(buildTreeFromData).mock.calls.length).toBeGreaterThan(0));
  const before = vi.mocked(buildTreeFromData).mock.calls.length;
  for (let i = 0; i < 10; i++) await view.rerender({ data: { value, outside: i } });
  expect(vi.mocked(buildTreeFromData).mock.calls.length).toBe(before);
  await view.rerender({ data: { value: { customer: 'Grace' }, outside: 9 } });
  await vi.waitFor(() =>
    expect(vi.mocked(buildTreeFromData).mock.calls.length).toBeGreaterThan(before),
  );
});
