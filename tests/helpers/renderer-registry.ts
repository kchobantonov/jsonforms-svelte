import { expect, it } from 'vite-plus/test';

/** Compare source entries, public exports and actual registries, including delegated cells. */
export function rendererRegistryContract(
  sources: Record<string, { entry: unknown }>,
  publicExports: Record<string, unknown>,
  registries: readonly (readonly unknown[])[],
) {
  const registered = registries.flat();
  const exported = Object.values(publicExports);
  it.each(Object.entries(sources))('registers and exports source entry %s', (path, module) => {
    expect(module.entry, path).toBeDefined();
    expect(registered, path).toContain(module.entry);
    expect(exported, path).toContain(module.entry);
  });
  it('exports every registered entry and keeps each registry free of duplicates', () => {
    for (const registry of registries) {
      expect(new Set(registry).size).toBe(registry.length);
      for (const entry of registry) expect(exported).toContain(entry);
    }
  });
}
