/** Adapted from jsonforms-react-renderer-common/colorFormat.ts at
 * 150fd688ae09f0f3b28e989649f3daf1d9f6d91d (MIT).
 * Copyright (c) 2024 Krasimir Chobantonov; see repository LICENSE.
 * Spec §§18.18.3, 18.27. Parsing fails explicitly instead of substituting black.
 */
export type ColorSaveFormat = 'hex' | 'hex3' | 'rgb' | 'hsb';

export const COLOR_SAVE_FORMATS: ColorSaveFormat[] = ['hex', 'hex3', 'rgb', 'hsb'];

export const DEFAULT_COLOR_SAVE_FORMAT: ColorSaveFormat = 'hex';

export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

export const asColorSaveFormat = (value: unknown): ColorSaveFormat =>
  COLOR_SAVE_FORMATS.includes(value as ColorSaveFormat)
    ? (value as ColorSaveFormat)
    : DEFAULT_COLOR_SAVE_FORMAT;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const normalizeHue = (hue: number): number => {
  const rounded = Math.round(hue);
  return ((rounded % 360) + 360) % 360;
};

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const FUNCTIONAL = /^(rgba?|hsla?|hsba?)\(([^()]*)\)$/i;

const NUMBER = /^[+-]?(?:\d+\.?\d*|\.\d+)%?$/;

const parseArgs = (text: string): { value: number; percent: boolean }[] | undefined => {
  // CSS Color 4 permits `rgb(0 255 0 / 50%)`; the specification's initial
  // profile is the comma-separated form only, so a space-separated argument
  // list is a parse failure rather than a second accepted syntax.
  const parts = text.split(',').map((part) => part.trim());
  const parsed = parts.map((part) => {
    if (!NUMBER.test(part)) {
      return undefined;
    }
    const percent = part.endsWith('%');
    return {
      value: Number(percent ? part.slice(0, -1) : part),
      percent,
    };
  });
  return parsed.every((part) => part !== undefined && Number.isFinite(part.value))
    ? (parsed as { value: number; percent: boolean }[])
    : undefined;
};

const parseAlpha = (arg: { value: number; percent: boolean } | undefined): number | undefined => {
  if (arg === undefined) {
    return 1;
  }
  const alpha = arg.percent ? arg.value / 100 : arg.value;
  return alpha >= 0 && alpha <= 1 ? alpha : undefined;
};

const expand3 = (hex: string): string => [...hex].map((digit) => digit + digit).join('');

export const parseColor = (value: unknown): Rgba | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const text = value.trim();
  if (HEX.test(text)) {
    const digits = text.slice(1);
    const full = digits.length === 3 ? expand3(digits) : digits;
    return {
      r: parseInt(full.slice(0, 2), 16),
      g: parseInt(full.slice(2, 4), 16),
      b: parseInt(full.slice(4, 6), 16),
      a: full.length === 8 ? parseInt(full.slice(6, 8), 16) / 255 : 1,
    };
  }
  const functional = FUNCTIONAL.exec(text);
  if (!functional) {
    return undefined;
  }
  const name = functional[1].toLowerCase();
  const args = parseArgs(functional[2]);
  if (!args || args.length < 3 || args.length > 4) {
    return undefined;
  }
  // `rgba(...)` with three arguments is opaque, and `rgb(...)` with four
  // carries alpha; CSS Color 4 made the two names synonyms, and rejecting the
  // combination would refuse text browsers accept.
  const alpha = parseAlpha(args[3]);
  if (alpha === undefined) {
    return undefined;
  }
  if (name.startsWith('rgb')) {
    // Section 18: "RGB channels are integers from 0 to 255". Percentage
    // channels are not in the profile, and a value outside the range is a
    // typing error worth reporting rather than clamping into a different
    // color the author did not write.
    const channels = args.slice(0, 3);
    if (
      channels.some(
        ({ value: channel, percent }) =>
          percent || !Number.isInteger(channel) || channel < 0 || channel > 255,
      )
    ) {
      return undefined;
    }
    return {
      r: channels[0].value,
      g: channels[1].value,
      b: channels[2].value,
      a: alpha,
    };
  }
  // The `%` sign is optional on input for saturation, lightness and
  // brightness - a hand-typed `hsl(120, 100, 50)` means the obvious thing -
  // but serialization always writes it.
  const hue = args[0].percent ? undefined : args[0].value;
  if (hue === undefined) {
    return undefined;
  }
  const second = args[1].value;
  const third = args[2].value;
  if (second < 0 || second > 100 || third < 0 || third > 100) {
    return undefined;
  }
  const rgb = name.startsWith('hsl') ? hslToRgb(hue, second, third) : hsbToRgb(hue, second, third);
  return { ...rgb, a: alpha };
};

export const isTransparent = (color: Rgba): boolean => color.a < 1;

const hueToRgbChannel = (p: number, q: number, t: number): number => {
  let shifted = t;
  if (shifted < 0) shifted += 1;
  if (shifted > 1) shifted -= 1;
  if (shifted < 1 / 6) return p + (q - p) * 6 * shifted;
  if (shifted < 1 / 2) return q;
  if (shifted < 2 / 3) return p + (q - p) * (2 / 3 - shifted) * 6;
  return p;
};

export const hslToRgb = (h: number, s: number, l: number): { r: number; g: number; b: number } => {
  const hue = normalizeHue(h) / 360;
  const saturation = clamp(s, 0, 100) / 100;
  const lightness = clamp(l, 0, 100) / 100;
  if (saturation === 0) {
    const gray = Math.round(lightness * 255);
    return { r: gray, g: gray, b: gray };
  }
  const q =
    lightness < 0.5
      ? lightness * (1 + saturation)
      : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;
  return {
    r: Math.round(hueToRgbChannel(p, q, hue + 1 / 3) * 255),
    g: Math.round(hueToRgbChannel(p, q, hue) * 255),
    b: Math.round(hueToRgbChannel(p, q, hue - 1 / 3) * 255),
  };
};

export const hsbToRgb = (h: number, s: number, b: number): { r: number; g: number; b: number } => {
  const hue = normalizeHue(h) / 60;
  const saturation = clamp(s, 0, 100) / 100;
  const brightness = clamp(b, 0, 100) / 100;
  const sector = Math.floor(hue) % 6;
  const offset = hue - Math.floor(hue);
  const p = brightness * (1 - saturation);
  const q = brightness * (1 - saturation * offset);
  const t = brightness * (1 - saturation * (1 - offset));
  const [r, g, blue] = [
    [brightness, t, p],
    [q, brightness, p],
    [p, brightness, t],
    [p, q, brightness],
    [t, p, brightness],
    [brightness, p, q],
  ][sector];
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(blue * 255),
  };
};

export const rgbToHsb = (color: Rgba): { h: number; s: number; b: number } => {
  const r = color.r / 255;
  const g = color.g / 255;
  const b = color.b / 255;
  const max = Math.max(r, g, b);
  const delta = max - Math.min(r, g, b);
  return {
    h: delta === 0 ? 0 : normalizeHue(hueOf(r, g, b, max, delta)),
    s: max === 0 ? 0 : Math.round((delta / max) * 100),
    b: Math.round(max * 100),
  };
};

const hueOf = (r: number, g: number, b: number, max: number, delta: number): number => {
  const sixth =
    max === r
      ? ((g - b) / delta + (g < b ? 6 : 0)) / 6
      : max === g
        ? ((b - r) / delta + 2) / 6
        : ((r - g) / delta + 4) / 6;
  return sixth * 360;
};

const pad = (channel: number): string => channel.toString(16).padStart(2, '0');

const formatAlpha = (a: number): string => String(Math.round(a * 100) / 100);

const toHex3Digit = (channel: number): string => Math.round(channel / 17).toString(16);

export const serializeColor = (color: Rgba, format: ColorSaveFormat): string | undefined => {
  const opaque = !isTransparent(color);
  switch (format) {
    case 'hex3':
      if (!opaque) {
        return undefined;
      }
      return `#${toHex3Digit(color.r)}${toHex3Digit(color.g)}${toHex3Digit(color.b)}`;
    case 'rgb':
      return opaque
        ? `rgb(${color.r}, ${color.g}, ${color.b})`
        : `rgba(${color.r}, ${color.g}, ${color.b}, ${formatAlpha(color.a)})`;
    case 'hsb': {
      const { h, s, b } = rgbToHsb(color);
      return opaque
        ? `hsb(${h}, ${s}%, ${b}%)`
        : `hsba(${h}, ${s}%, ${b}%, ${formatAlpha(color.a)})`;
    }
    case 'hex':
    default: {
      const base = `#${pad(color.r)}${pad(color.g)}${pad(color.b)}`;
      // Eight-digit hex quantizes alpha to 1/255, so `rgba(..., 0.5)` stores as
      // `#...80` and reads back as 0.502. That is the precision limit section
      // 18 asks to be documented, not a rounding bug.
      return opaque ? base : `${base}${pad(Math.round(color.a * 255))}`;
    }
  }
};

export const toCssColor = (value: unknown): string | undefined => {
  const parsed = parseColor(value);
  return parsed ? serializeColor(parsed, 'hex') : undefined;
};

export const placeholderKeyFor = (format: ColorSaveFormat) =>
  `color.placeholder.${format}` as const;
