/** Portable mask tokens, matching the React reference's maskFormat contract. */
export interface MaskToken {
  pattern: RegExp;
  multiple?: boolean;
  optional?: boolean;
  repeated?: boolean;
}

export const DEFAULT_MASK_TOKENS: Record<string, MaskToken> = {
  '#': { pattern: /[0-9]/ },
  '@': { pattern: /[a-zA-Z]/ },
  '*': { pattern: /[a-zA-Z0-9]/ },
};

export function compileTokenPattern(source: string): RegExp | undefined {
  try {
    return new RegExp(source, 'u');
  } catch {
    try {
      return new RegExp(source);
    } catch {
      return undefined;
    }
  }
}

export function toMaskTokens(
  specs: unknown,
  onInvalid?: (token: string) => void,
): Record<string, MaskToken> {
  const result = { ...DEFAULT_MASK_TOKENS };
  if (specs == null) return result;
  if (typeof specs !== 'object' || Array.isArray(specs)) {
    onInvalid?.('');
    return result;
  }
  for (const [key, spec] of Object.entries(specs)) {
    if (!spec) {
      delete result[key];
      continue;
    }
    const source = typeof spec === 'string' ? spec : spec.pattern;
    const pattern =
      source instanceof RegExp
        ? new RegExp(source.source, source.flags)
        : typeof source === 'string'
          ? compileTokenPattern(source)
          : undefined;
    if (!pattern) {
      onInvalid?.(key);
      continue;
    }
    const token: MaskToken = { pattern };
    for (const flag of ['multiple', 'optional', 'repeated'] as const)
      if (typeof spec === 'object' && spec[flag] === true) token[flag] = true;
    Object.defineProperty(result, key, {
      value: token,
      enumerable: true,
      configurable: true,
      writable: true,
    });
  }
  return result;
}
