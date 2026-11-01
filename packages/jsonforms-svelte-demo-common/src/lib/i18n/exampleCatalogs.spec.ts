import { expect, it } from 'vite-plus/test';

const catalogs = import.meta.glob('../examples/**/*translations*.json', {
  eager: true,
  import: 'default',
}) as Record<string, { en: Record<string, unknown>; bg: Record<string, unknown> }>;

function entries(value: Record<string, unknown>, path: string[] = []): [string, string][] {
  return Object.entries(value).flatMap(([key, child]) => {
    const target = [...path, key];
    if (typeof child === 'string') return [[JSON.stringify(target), child]];
    if (child && typeof child === 'object' && !Array.isArray(child)) {
      return entries(child as Record<string, unknown>, target);
    }
    throw new Error(`Unexpected catalog value at ${target.join('.')}`);
  });
}

function parameters(message: string): string[] {
  return [...message.matchAll(/\$?\{(\w+)\}/g)].map((match) => match[1]).sort();
}

it('keeps EN/BG example and supplemental catalog keys and parameters aligned', () => {
  expect(Object.keys(catalogs).length).toBeGreaterThan(0);
  for (const [file, catalog] of Object.entries(catalogs)) {
    const english = new Map(entries(catalog.en));
    const bulgarian = new Map(entries(catalog.bg));
    expect([...bulgarian.keys()].sort(), file).toEqual([...english.keys()].sort());
    for (const [key, source] of english) {
      const translated = bulgarian.get(key)!;
      expect(source.trim(), `${file}: ${key} (en)`).not.toBe('');
      expect(translated.trim(), `${file}: ${key} (bg)`).not.toBe('');
      expect(parameters(translated), `${file}: ${key}`).toEqual(parameters(source));
    }
  }
});
