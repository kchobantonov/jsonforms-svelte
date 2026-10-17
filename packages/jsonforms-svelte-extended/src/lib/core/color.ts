import { rendererMessage } from '@chobantonov/jsonforms-svelte';
import { parseColor, serializeColor, asColorSaveFormat } from './colorProfile';
export * from './colorProfile';

export const COLOR_PATTERN = '^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$';
export const COLOR_REGEX = new RegExp(COLOR_PATTERN);
export const COLOR_MASKS = ['!#HHH', '!#HHHHHH', '!#HHHHHHHH'];
export const COLOR_MASK_TOKENS = { H: { pattern: /[0-9a-fA-F]/ } };

export const isColor = (value: unknown): value is string =>
  typeof value === 'string' && parseColor(value) !== undefined;

export const toColorInputValue = (value: unknown, fallback = '#000000'): string => {
  const parsed = parseColor(value);
  if (!parsed) return fallback;
  // Preserve the historical helper's hex case; this value is only a preview.
  if (typeof value === 'string' && COLOR_REGEX.test(value)) {
    if (value.length === 4) return '#' + [...value.slice(1)].map((digit) => digit + digit).join('');
    return value.slice(0, 7);
  }
  return serializeColor({ ...parsed, a: 1 }, 'hex')!;
};

export const isTransparentColor = (value: unknown): boolean => {
  const parsed = parseColor(value);
  return parsed !== undefined && parsed.a < 1;
};

/** Nearest #RGB color; transparency cannot be represented. */
export const toHex3 = (value: unknown): string | undefined => {
  const parsed = parseColor(value);
  return parsed ? serializeColor(parsed, 'hex3') : undefined;
};

export function resolveColorOptions(
  config: Record<string, unknown> | undefined,
  local: Record<string, unknown> | undefined,
) {
  const namespace = config?.jsonformsExtended;
  const extended =
    namespace && typeof namespace === 'object' && !Array.isArray(namespace)
      ? (namespace as Record<string, unknown>)
      : undefined;
  const textEntry = [local?.colorTextEntry, extended?.colorTextEntry, config?.colorTextEntry].find(
    (value) => typeof value === 'boolean',
  );
  const format = local?.colorSaveFormat ?? extended?.colorSaveFormat ?? config?.colorSaveFormat;
  return { textEntry: textEntry ?? true, saveFormat: asColorSaveFormat(format) };
}

export function colorMessage(
  locale: string | undefined,
  key: 'choose' | 'chooseEmpty' | 'clear' | 'invalid' | 'hex3Transparency',
): string {
  return rendererMessage(locale, `color.${key}`);
}
