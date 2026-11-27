import type { UISchemaElement } from '@jsonforms/core';

export type LayoutStyle = Record<string, string | number | undefined>;

/**
 * The portable layout sizing model, sections 6 and 7.
 *
 * Two kinds of option, on two different elements:
 *
 * - **`options.layout` on a child** says how that child participates in its
 *   parent - `span`, `weight`, `width`, `height` and the min/max constraints.
 * - **flat options on the layout** configure the container itself - `gap`,
 *   `wrap`, `align`, `justify`, `minItemWidth`, and `gridColumns` for a
 *   horizontal layout.
 *
 * "Flat layout options configure immediate children. `options.layout`
 * configures child participation."
 *
 * This module is pure: it turns those options into CSS and a list of
 * diagnostics, and knows nothing about React or antd.
 */

/** "On web numeric Dimension means CSS px". */
export type Dimension = number | string;

export interface LayoutItemOptions {
  span?: number;
  weight?: number;
  width?: Dimension;
  minWidth?: Dimension;
  maxWidth?: Dimension;
  height?: Dimension;
  minHeight?: Dimension;
  maxHeight?: Dimension;
  /** Reserved by the specification; accepted and ignored. */
  start?: number;
  /** Reserved by the specification; accepted and ignored. */
  responsive?: unknown;
}

export interface LayoutContainerOptions {
  gap?: Dimension;
  wrap?: boolean;
  minItemWidth?: Dimension;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';
  resizable?: boolean;
  /** Horizontal layouts only. */
  gridColumns?: number;
}

export type LayoutDirection = 'row' | 'column';

/** The renderer default, the last step of the `gridColumns` chain. */
export const DEFAULT_GRID_COLUMNS = 16;

/** Portable fallbacks; an explicit adapter override remains available. */
export type LayoutGapDefaults = Record<LayoutDirection, Dimension>;
const DEFAULT_GAPS: LayoutGapDefaults = { row: 16, column: 16 };

export interface LayoutDiagnostic {
  /** Index of the child it concerns, or -1 for the container. */
  index: number;
  message: string;
}

const isPositiveInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0;

const isUsableWeight = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

/** "dimensions non-negative where appropriate". */
const isDimension = (value: unknown): value is Dimension =>
  (typeof value === 'number' && Number.isFinite(value) && value >= 0) ||
  (typeof value === 'string' && value.trim().length > 0);

/** A number is CSS pixels; a string is passed through as authored. */
export const toCss = (value: Dimension): string =>
  typeof value === 'number' ? `${value}px` : value;

/**
 * `gridColumns`: explicit -> `jsonformsExtended.layoutDefaults.gridColumns` ->
 * renderer default -> 16.
 */
export const resolveGridColumns = (
  options: LayoutContainerOptions | undefined,
  config: unknown,
): number => {
  if (isPositiveInteger(options?.gridColumns)) {
    return options!.gridColumns as number;
  }
  const fromDefaults = layoutDefaultsOf(config)?.gridColumns;
  return isPositiveInteger(fromDefaults) ? fromDefaults : DEFAULT_GRID_COLUMNS;
};

/** `wrap`: explicit -> `jsonformsExtended.layoutDefaults.wrap` -> false. */
export const resolveWrap = (
  options: LayoutContainerOptions | undefined,
  config: unknown,
): boolean => {
  if (typeof options?.wrap === 'boolean') {
    return options.wrap;
  }
  const fromDefaults = layoutDefaultsOf(config)?.wrap;
  return typeof fromDefaults === 'boolean' ? fromDefaults : false;
};

/**
 * `gap`: explicit -> `jsonformsExtended.layoutDefaults.gap` -> the renderer
 * default for this direction.
 *
 * `direction` is required rather than defaulted: renderer families may supply
 * different defaults for the two directions, and a caller that forgot to pass it would silently give
 * a column the row's gutter.
 */
export const resolveGap = (
  options: LayoutContainerOptions | undefined,
  config: unknown,
  direction: LayoutDirection,
  defaults: LayoutGapDefaults = DEFAULT_GAPS,
): Dimension => {
  if (isDimension(options?.gap)) {
    return options!.gap as Dimension;
  }
  const fromDefaults = layoutDefaultsOf(config)?.gap;
  if (isDimension(fromDefaults)) {
    return fromDefaults;
  }
  return defaults[direction];
};

/** A local zero minimum overrides a configured minimum. */
export const resolveMinItemWidth = (
  options: LayoutContainerOptions | undefined,
  config: unknown,
): Dimension | undefined => {
  if (isDimension(options?.minItemWidth)) return options.minItemWidth;
  const vendor = svelteLayoutDefaultsOf(config)?.minItemWidth;
  return isDimension(vendor) ? vendor : undefined;
};

/** Svelte-only global options live outside the portable extension namespace. */
const svelteLayoutDefaultsOf = (
  config: unknown,
): Pick<LayoutContainerOptions, 'minItemWidth'> | undefined => {
  const vendor = (config as Record<string, unknown> | undefined)?.['jsonformsSvelte'] as
    | Record<string, unknown>
    | undefined;
  const defaults = vendor?.['layoutDefaults'];
  return defaults && typeof defaults === 'object'
    ? (defaults as Pick<LayoutContainerOptions, 'minItemWidth'>)
    : undefined;
};

/** Portable `jsonformsExtended.layoutDefaults` settings. The Svelte-only
 * minimum item width is read separately from the vendor namespace above. */
const layoutDefaultsOf = (
  config: unknown,
): (LayoutContainerOptions & { gridColumns?: number }) | undefined => {
  const extended = (config as Record<string, unknown> | undefined)?.['jsonformsExtended'] as
    | Record<string, unknown>
    | undefined;
  const defaults = extended?.['layoutDefaults'];
  return defaults && typeof defaults === 'object'
    ? (defaults as LayoutContainerOptions)
    : undefined;
};

const ALIGN: Record<string, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
};

const JUSTIFY: Record<string, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  'space-between': 'space-between',
  'space-around': 'space-around',
  'space-evenly': 'space-evenly',
};

export interface ContainerOptionDiagnostic {
  code: 'layout.invalidOption' | 'layout.unsupportedOption';
  message: string;
}

/** Invalid local and global layout defaults still fall back, but must not fail silently. */
export function containerOptionDiagnostics(
  options: LayoutContainerOptions | undefined,
  config: unknown,
  direction: LayoutDirection,
  splitter = false,
): ContainerOptionDiagnostic[] {
  const diagnostics: ContainerOptionDiagnostic[] = [];
  const sources = [
    ['options', options],
    ['config.jsonformsExtended.layoutDefaults', layoutDefaultsOf(config)],
  ] as const;
  for (const [source, values] of sources) {
    if (!values) continue;
    const check = (key: keyof LayoutContainerOptions, valid: boolean, requirement: string) => {
      if (values[key] !== undefined && !valid)
        diagnostics.push({
          code: 'layout.invalidOption',
          message: `${source}.${key} must be ${requirement}; ignored.`,
        });
    };
    check('gap', isDimension(values.gap), 'a non-negative dimension');
    if (source === 'options')
      check('minItemWidth', isDimension(values.minItemWidth), 'a non-negative dimension');
    check('wrap', typeof values.wrap === 'boolean', 'a boolean');
    check(
      'align',
      typeof values.align === 'string' && Object.hasOwn(ALIGN, values.align),
      'a supported alignment',
    );
    check(
      'justify',
      typeof values.justify === 'string' && Object.hasOwn(JUSTIFY, values.justify),
      'a supported justification',
    );
    if (direction === 'row')
      check('gridColumns', isPositiveInteger(values.gridColumns), 'a positive integer');
    else if (source === 'options' && values.gridColumns !== undefined)
      diagnostics.push({
        code: 'layout.unsupportedOption',
        message: 'options.gridColumns has no effect in a vertical layout; ignored.',
      });
    if (source === 'options' && !splitter && values.resizable !== undefined)
      diagnostics.push({
        code: 'layout.unsupportedOption',
        message: 'options.resizable has no effect outside a split layout; ignored.',
      });
  }
  const vendorMinimum = svelteLayoutDefaultsOf(config)?.minItemWidth;
  if (vendorMinimum !== undefined && !isDimension(vendorMinimum)) {
    diagnostics.push({
      code: 'layout.invalidOption',
      message:
        'config.jsonformsSvelte.layoutDefaults.minItemWidth must be a non-negative dimension; ignored.',
    });
  }
  return diagnostics;
}

/** "justify = main axis; align = cross axis." */
export const containerStyle = (
  options: LayoutContainerOptions | undefined,
  config: unknown,
  direction: LayoutDirection,
  defaults: LayoutGapDefaults = DEFAULT_GAPS,
): LayoutStyle => {
  const wrap = resolveWrap(options, config);
  return {
    display: 'flex',
    flexDirection: direction,
    // "Structural layouts have no implicit outer padding."
    padding: 0,
    // "Gap applies only between effective visible immediate children", which
    // is exactly what CSS `gap` does.
    gap: toCss(resolveGap(options, config, direction, defaults)),
    flexWrap: wrap ? 'wrap' : 'nowrap',
    alignItems:
      typeof options?.align === 'string' && Object.hasOwn(ALIGN, options.align)
        ? ALIGN[options.align]
        : undefined,
    justifyContent:
      typeof options?.justify === 'string' && Object.hasOwn(JUSTIFY, options.justify)
        ? JUSTIFY[options.justify]
        : undefined,
    minWidth: 0,
  };
};

/**
 * The span width formula, with the gap accounted for.
 *
 * For usable row width W, G grid columns and gap g the specification gives
 *
 *     c = (W - (G - 1) * g) / G
 *     spanWidth(n) = n * c + (n - 1) * g
 *
 * which rearranges to a form CSS can evaluate without knowing W:
 *
 *     spanWidth(n) = (n / G) * W - g * (G - n) / G
 */
export const spanBasis = (span: number, grid: number, gap: Dimension): string => {
  const percent = (span / grid) * 100;
  const gapShare = (grid - span) / grid;
  if (gapShare === 0) {
    return `${percent}%`;
  }
  return `calc(${percent}% - ${gapShare} * ${toCss(gap)})`;
};

export const itemOptionsOf = (
  element: UISchemaElement | undefined,
): LayoutItemOptions | undefined => {
  const layout = (element as { options?: Record<string, unknown> })?.options?.['layout'];
  return layout && typeof layout === 'object' ? (layout as LayoutItemOptions) : undefined;
};

export interface ItemSizing {
  style: LayoutStyle;
  diagnostics: string[];
  diagnosticEntries: LayoutItemDiagnostic[];
}

export interface LayoutItemDiagnostic {
  code:
    | 'layout.invalidOption'
    | 'layout.unsupportedOption'
    | 'layout.spanUnsupported'
    | 'layout.spanClamped'
    | 'layout.multipleSizingModes';
  message: string;
}

/**
 * One child's participation, resolved.
 *
 * "Primary modes: Auto, Span, Weight, Fixed. Conflict precedence:
 * Fixed > Span > Weight > Auto. Min/max are constraints."
 *
 * The min/max are applied as CSS constraints rather than by redistributing
 * here, because the browser performs the same redistribution the
 * specification describes - flexible children shrink first, then span and
 * fixed ones down to their minimum.
 */
export const itemSizing = (
  element: UISchemaElement | undefined,
  direction: LayoutDirection,
  grid: number,
  gap: Dimension,
  minItemWidth?: Dimension,
): ItemSizing => {
  const item = itemOptionsOf(element);
  const diagnostics: string[] = [];
  const diagnosticEntries: LayoutItemDiagnostic[] = [];
  const diagnose = (code: LayoutItemDiagnostic['code'], message: string) => {
    diagnostics.push(message);
    diagnosticEntries.push({ code, message });
  };
  const style: LayoutStyle = { minWidth: 0 };

  const horizontal = direction === 'row';
  const crossKey = horizontal ? 'height' : 'width';
  const cross = item?.[crossKey];
  if (cross !== undefined) {
    if (isDimension(cross)) style[crossKey] = toCss(cross);
    else
      diagnose(
        'layout.invalidOption',
        `\`${crossKey}\` must be a non-negative dimension; ignored.`,
      );
  }
  /*
    A Spacer carries its size at the top level rather than in `options.layout`,
    and it applies to the parent's **main axis** - width in a row, height in a
    column. Resolving it here is what makes the axis follow the parent without
    the Spacer having to know which layout contains it, and without the
    agnostic package reaching into this one.

    `options.layout` still wins, so a Spacer may take a weight instead.
  */
  const spacerSize =
    (element as { type?: string })?.type === 'Spacer'
      ? (element as unknown as { size?: Dimension }).size
      : undefined;
  const main =
    (horizontal ? item?.width : item?.height) ??
    (item?.span === undefined && item?.weight === undefined ? spacerSize : undefined);
  let span = item?.span;

  if (span !== undefined && !isPositiveInteger(span)) {
    diagnose('layout.invalidOption', '`span` must be a positive integer; ignored.');
    span = undefined;
  } else if (span !== undefined && !horizontal) {
    /*
      "Unsupported hints are ignored with diagnostic; e.g. span under
      Group/VerticalLayout does not create a horizontal grid."
    */
    diagnose('layout.spanUnsupported', '`span` has no effect in a vertical layout; ignored.');
    span = undefined;
  } else if (span !== undefined && span > grid) {
    // "Clamp span above gridColumns and diagnose."
    diagnose(
      'layout.spanClamped',
      `\`span\` ${span} exceeds gridColumns ${grid}; clamped to ${grid}.`,
    );
    span = grid;
  }

  let weight = item?.weight;
  if (weight !== undefined && !isUsableWeight(weight)) {
    diagnose('layout.invalidOption', '`weight` must be a finite number greater than 0; ignored.');
    weight = undefined;
  }

  if (main !== undefined && !isDimension(main)) {
    diagnose(
      'layout.invalidOption',
      `\`${horizontal ? 'width' : 'height'}\` must be a non-negative dimension; ignored.`,
    );
  }

  const activeModes = [
    main !== undefined && isDimension(main) ? 'fixed' : undefined,
    span !== undefined ? 'span' : undefined,
    weight !== undefined ? 'weight' : undefined,
  ].filter((mode): mode is string => mode !== undefined);
  if (activeModes.length > 1) {
    diagnose(
      'layout.multipleSizingModes',
      `Multiple sizing modes (${activeModes.join(', ')}); using ${activeModes[0]}.`,
    );
  }

  // Fixed
  if (main !== undefined && isDimension(main)) {
    style.flex = `0 0 ${toCss(main)}`;
  } else if (span !== undefined) {
    // Span, against the complete logical grid
    style.flex = `0 0 ${spanBasis(span, grid, gap)}`;
  } else if (weight !== undefined) {
    /*
      Weight. The two axes are **not** the same basis, which is the whole of
      the specification's vertical qualifier: "vertical weight distributes
      remaining height only when parent height is definite/resolvable".

      A `0` basis in a column would collapse the child to nothing whenever the
      parent's height is indefinite, which is the ordinary case for a form. An
      `auto` basis is the rule expressed in CSS: the child starts at its
      content height, and weight divides whatever space is left over - none
      when the height is indefinite, the remainder when it is not.
    */
    style.flex = horizontal ? `${weight} 1 0` : `${weight} 1 auto`;
  } else {
    /*
      Auto. "Horizontal Auto behaves as weight 1. Vertical Auto means
      natural/content height."
    */
    style.flex = horizontal ? '1 1 0' : '0 0 auto';
  }

  const constraint = (
    value: Dimension | undefined,
    key: 'minWidth' | 'maxWidth' | 'minHeight' | 'maxHeight',
  ) => {
    if (value === undefined) return;
    if (!isDimension(value)) {
      diagnose('layout.invalidOption', `\`${key}\` must be a non-negative dimension; ignored.`);
      return;
    }
    (style as Record<string, unknown>)[key] = toCss(value);
  };

  constraint(item?.minWidth, 'minWidth');
  constraint(item?.maxWidth, 'maxWidth');
  constraint(item?.minHeight, 'minHeight');
  constraint(item?.maxHeight, 'maxHeight');

  /*
    "`minItemWidth` is parent default minimum" - a default the child's own
    `minWidth` overrides.
  */
  if (
    horizontal &&
    item?.minWidth === undefined &&
    minItemWidth !== undefined &&
    isDimension(minItemWidth)
  ) {
    style.minWidth = toCss(minItemWidth);
  }

  return { style, diagnostics, diagnosticEntries };
};

/** Resolve the Spacer size from its declared field. */
export function resolveSpacerSize(element: UISchemaElement): Dimension {
  const candidates = [(element as UISchemaElement & { size?: unknown }).size];
  for (const candidate of candidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) return Math.max(0, candidate);
    if (typeof candidate === 'string' && candidate.trim()) return candidate;
  }
  return 32;
}
