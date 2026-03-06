export type JsonInput = unknown;

export const parseJson = <T>(value: JsonInput, fallback: T): T => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  if (typeof value !== 'string') {
    return value as T;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const parseBoolean = (value: boolean | string, fallback: boolean): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }

  return fallback;
};

export const parseMode = (value: boolean | string): 'dark' | 'light' | 'system' => {
  if (typeof value === 'boolean') {
    return value ? 'dark' : 'light';
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === 'dark') return 'dark';
  if (normalized === 'false' || normalized === 'light') return 'light';
  if (normalized === 'system' || normalized === 'auto') return 'system';
  return 'system';
};
