import { Resolve, type JsonSchema, type UISchemaElement } from '@jsonforms/core';
import { isAllowedImageUrl, resolveUrlPolicy } from './urlPolicy';
import { mixedValueAt } from './mixedLiteral';
import { resolveScopeSchema, scopeDataSegments } from './schemaScope';

export type ImageViewElement = UISchemaElement & {
  type: 'ImageView';
  src?: unknown;
  scope?: string;
  alt?: string;
  i18n?: string;
};

/** Stable machine-readable codes, per section 21. */
export type ImageViewDiagnosticCode =
  | 'image.noSource'
  | 'image.missingAlt'
  | 'image.scopeNotString'
  | 'image.nonStringSource'
  | 'image.urlRefused';

export interface ImageViewDiagnostic {
  code: ImageViewDiagnosticCode;
  severity: 'warning' | 'error';
  message: string;
}

/**
 * Whether a scoped schema permits a string.
 *
 * An untyped schema permits anything, so it passes. A `type` that is an array
 * passes if `string` is among its members - `["string", "null"]` is a normal
 * way to spell an optional image.
 */
const permitsString = (schema: JsonSchema | boolean | undefined): boolean => {
  if (typeof schema === 'boolean') return schema;
  if (schema === undefined) {
    return false;
  }
  const type = (schema as { type?: unknown }).type;
  if (type === undefined) {
    return true;
  }
  return Array.isArray(type) ? type.includes('string') : type === 'string';
};

export interface ResolvedImageView {
  /** The URL to render, or undefined for "show no image". */
  src?: string;
  alt: string;
  diagnostics: ImageViewDiagnostic[];
}

/**
 * Image source resolution from specification section 13.
 *
 * Kept separate from the component because the precedence is the part worth
 * testing directly: which of `src` and `scope` wins, when an empty value is a
 * deliberate blank rather than a missing one, and which failures are silent.
 */
export const resolveImageView = (
  element: ImageViewElement,
  args: {
    schema?: JsonSchema;
    rootSchema?: JsonSchema;
    data?: unknown;
    path?: string;
    config?: unknown;
  },
): ResolvedImageView => {
  const diagnostics: ImageViewDiagnostic[] = [];
  const options = (element as { options?: Record<string, unknown> }).options;

  /*
    `options.src` / `options.alt` are where this renderer used to read from,
    before the top-level fields existed. Kept as a fallback so forms authored
    against the old shape keep working; the top-level field wins when both are
    present. See adjustment 23.
  */
  const src =
    element.src !== undefined
      ? element.src
      : typeof options?.src === 'string'
        ? (options.src as string)
        : undefined;
  const altField =
    element.alt !== undefined
      ? element.alt
      : typeof options?.alt === 'string'
        ? (options.alt as string)
        : undefined;

  /*
    `alt` is required, and `alt: ""` is the documented way to mark an image
    decorative. Defaulting a missing one to `""` silently declares every image
    decorative, so the omission is reported - but the image still renders,
    since withholding content over a missing annotation helps nobody.
  */
  if (altField === undefined) {
    diagnostics.push({
      code: 'image.missingAlt',
      severity: 'warning',
      message: 'ImageView requires a top-level `alt`. Use `alt: ""` to mark the image decorative.',
    });
  }
  const alt = altField ?? '';

  const policy = resolveUrlPolicy(args.config);
  const checkUrl = (candidate: unknown): string | undefined => {
    if (typeof candidate !== 'string') {
      diagnostics.push({
        code: 'image.nonStringSource',
        severity: 'error',
        message: 'The image source must be a URL string.',
      });
      return undefined;
    }
    if (candidate === '') {
      return undefined;
    }
    if (!isAllowedImageUrl(candidate, policy)) {
      diagnostics.push({
        code: 'image.urlRefused',
        severity: 'error',
        message:
          'The image source is blocked by the configured URL policy. Use an allowed image URL or adjust the image URL policy.',
      });
      return undefined;
    }
    return candidate;
  };

  /*
    A defined `src` is the source, full stop. The specification is explicit
    that an invalid one "does not silently fall through to scope" - falling
    through would show a different image than the one the author named.
  */
  if (src !== undefined) {
    return { src: checkUrl(src), alt, diagnostics };
  }

  if (element.scope === undefined) {
    diagnostics.push({
      code: 'image.noSource',
      severity: 'error',
      message: 'ImageView requires at least one of `src` and `scope`.',
    });
    return { alt, diagnostics };
  }

  const scopedSchema = resolveScopeSchema(
    args.schema ?? args.rootSchema ?? {},
    element.scope,
    args.rootSchema ?? args.schema ?? {},
  );
  if (!permitsString(scopedSchema)) {
    diagnostics.push({
      code: 'image.scopeNotString',
      severity: 'error',
      message: `The schema at ${element.scope} does not permit strings.`,
    });
    return { alt, diagnostics };
  }

  // Control scope semantics, so an ImageView inside an array item resolves
  // against that item rather than the root.
  const context = Resolve.data(args.data, args.path ?? '');
  const value = mixedValueAt(context, scopeDataSegments(element.scope));

  // "Empty or missing source data displays no image" - not an error; the
  // property simply has not been filled in yet.
  if (value === undefined || value === null || value === '') {
    return { alt, diagnostics };
  }
  if (typeof value !== 'string') {
    diagnostics.push({
      code: 'image.nonStringSource',
      severity: 'error',
      message: `The value at ${element.scope} is a ${typeof value}, not a URL string.`,
    });
    return { alt, diagnostics };
  }
  return { src: checkUrl(value), alt, diagnostics };
};
