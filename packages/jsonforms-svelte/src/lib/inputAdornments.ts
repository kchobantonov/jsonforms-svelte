export type InputAdornment =
  | { kind: 'text'; text: string; i18n?: string; tooltip?: string }
  | {
      kind: 'icon';
      icon: string;
      label: string;
      i18n?: string;
      tooltip?: string;
      decorative?: false;
    }
  | { kind: 'icon'; icon: string; decorative: true };

export function inputAdornments(value: unknown): InputAdornment[] {
  const values = Array.isArray(value) ? value : [value];
  return values.flatMap((item) => {
    if (typeof item === 'string')
      return item && !Array.isArray(value) ? [{ kind: 'text' as const, text: item }] : [];
    if (!item || typeof item !== 'object') return [];
    const entry = item as Record<string, unknown>;
    if (entry.kind === 'text' && typeof entry.text === 'string' && entry.text)
      return [entry as InputAdornment];
    if (
      entry.kind === 'icon' &&
      typeof entry.icon === 'string' &&
      entry.icon &&
      (entry.decorative === true || (typeof entry.label === 'string' && entry.label))
    )
      return [entry as InputAdornment];
    return [];
  });
}

export function supportsInputAdornments(
  schema:
    | { type?: unknown; enum?: unknown; format?: unknown; contentEncoding?: unknown }
    | undefined,
  options: Record<string, unknown>,
): boolean {
  const type = schema?.type;
  if (type !== 'string' && type !== 'number' && type !== 'integer') return false;
  if (
    schema?.format === 'binary' ||
    schema?.format === 'byte' ||
    schema?.contentEncoding === 'base64'
  )
    return false;
  if (
    options.slider === true ||
    options.variant === 'otp' ||
    options.format === 'code' ||
    options.format === 'radio' ||
    options.showRadio === true
  )
    return false;
  return true;
}
