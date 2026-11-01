import { expect, it } from 'vite-plus/test';
import {
  isDemoLocale,
  preferenceTypeGuard,
  readStoredPreference,
  writeStoredPreference,
} from './preferenceStorage';

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
    removeItem: (key: string) => void values.delete(key),
  };
}

const isMode = (value: unknown): value is 'system' | 'light' | 'dark' =>
  value === 'system' || value === 'light' || value === 'dark';

it('migrates legacy values into versioned per-family preferences', () => {
  const storage = memoryStorage();
  storage.setItem('shadcn-example-mode', 'dark');
  storage.setItem('skeleton-example-mode', 'light');
  storage.setItem('shadcn-example-design-system', JSON.stringify({ style: 'nova' }));
  expect(readStoredPreference(storage, 'shadcn-example-mode', 'system', isMode)).toBe('dark');
  expect(readStoredPreference(storage, 'skeleton-example-mode', 'system', isMode)).toBe('light');
  expect(storage.getItem('shadcn-example-mode')).toBe('{"version":1,"value":"dark"}');
  expect(storage.getItem('skeleton-example-mode')).toBe('{"version":1,"value":"light"}');
  expect(
    readStoredPreference(
      storage,
      'shadcn-example-design-system',
      { style: 'default' },
      preferenceTypeGuard({ style: 'default' }),
    ),
  ).toEqual({ style: 'nova' });
});

it('migrates the previous empty default-layout spelling to the declared value', () => {
  const storage = memoryStorage();
  const isLayout = (value: unknown): value is 'default' | 'demo-and-data' =>
    value === 'default' || value === 'demo-and-data';
  const migrateLayout = (value: unknown) => (value === '' ? ('default' as const) : undefined);
  for (const raw of ['', '{"version":1,"value":""}']) {
    storage.setItem('shadcn-example-layout', raw);
    expect(
      readStoredPreference(storage, 'shadcn-example-layout', 'default', isLayout, migrateLayout),
    ).toBe('default');
    expect(storage.getItem('shadcn-example-layout')).toBe('{"version":1,"value":"default"}');
  }
});

it('falls back for corrupt, unsupported, or invalid preferences without changing them', () => {
  const storage = memoryStorage();
  for (const raw of [
    '{broken',
    '{"version":2,"value":"dark"}',
    '{"version":1,"value":"unknown"}',
  ]) {
    storage.setItem('flowbite-example-mode', raw);
    expect(readStoredPreference(storage, 'flowbite-example-mode', 'system', isMode)).toBe('system');
    expect(storage.getItem('flowbite-example-mode')).toBe(raw);
  }
  expect(readStoredPreference(storage, 'missing', 'system', isMode)).toBe('system');
  expect(preferenceTypeGuard(0)(Number.NaN)).toBe(false);
  expect(preferenceTypeGuard({})([])).toBe(false);
  expect(isDemoLocale('fr-CA')).toBe(true);
  expect(isDemoLocale('{broken')).toBe(false);
});

it('retains in-memory fallback when storage access or writes are denied', () => {
  const blocked = {
    getItem: () => {
      throw new Error('SecurityError');
    },
    setItem: () => {
      throw new Error('QuotaExceededError');
    },
    removeItem: () => {
      throw new Error('SecurityError');
    },
  };
  expect(readStoredPreference(blocked, 'flowbite-example-mode', 'system', isMode)).toBe('system');
  expect(() => writeStoredPreference(blocked, 'flowbite-example-mode', 'dark')).not.toThrow();
  expect(() => writeStoredPreference(blocked, 'flowbite-example-mode', undefined)).not.toThrow();
});

it('writes and removes versioned preferences without affecting another family', () => {
  const storage = memoryStorage();
  writeStoredPreference(storage, 'flowbite-example-mode', 'dark');
  writeStoredPreference(storage, 'shadcn-example-mode', 'light');
  expect(readStoredPreference(storage, 'flowbite-example-mode', 'system', isMode)).toBe('dark');
  writeStoredPreference(storage, 'flowbite-example-mode', undefined);
  expect(storage.getItem('flowbite-example-mode')).toBeNull();
  expect(readStoredPreference(storage, 'shadcn-example-mode', 'system', isMode)).toBe('light');
});
