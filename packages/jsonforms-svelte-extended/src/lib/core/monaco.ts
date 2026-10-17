import { isMixedSchema, resolveMixedStructuredLayout } from '@chobantonov/jsonforms-svelte';
import {
  Resolve,
  and,
  isStringControl,
  optionIs,
  or,
  rankWith,
  uiTypeIs,
  type Tester,
  type RankedTester,
} from '@jsonforms/core';
import type { editor } from 'monaco-editor';

const explicitMonacoControlTester = rankWith(
  3,
  and(
    optionIs('format', 'code'),
    or(
      isStringControl,
      and(uiTypeIs('Control'), optionIs('language', 'json'), optionIs('convertJson', true)),
    ),
  ),
);

export const isMixedCodeControl: Tester = (uischema, schema, context) =>
  uiTypeIs('Control')(uischema, schema, context) &&
  resolveMixedStructuredLayout(uischema.options, context.config) === 'code' &&
  isMixedSchema(uischema, schema, context);

export const monacoControlTester: RankedTester = (uischema, schema, context) =>
  isMixedCodeControl(uischema, schema, context)
    ? 21
    : explicitMonacoControlTester(uischema, schema, context);

export interface MonacoRendererOptions {
  rows?: number;
  minRows?: number;
  maxRows?: number;
  autoGrow?: boolean;
  options?: Omit<
    editor.IStandaloneEditorConstructionOptions,
    'language' | 'model' | 'theme' | 'value'
  >;
  initActions?: string[];
}

/** Monaco bags replace wholesale; error publication has a namespaced default.
 * Keep this separate from native renderer option merging and tester dispatch.
 */
export function resolveMonacoAppliedOptions(
  config: Record<string, unknown> | undefined,
  local: Record<string, unknown> | undefined,
  mixedCode = false,
): Record<string, unknown> {
  const extended = config?.jsonformsExtended;
  const namespaced =
    extended && typeof extended === 'object' && !Array.isArray(extended)
      ? (extended as Record<string, unknown>).propagateErrors
      : undefined;
  const propagateErrors = [local?.propagateErrors, namespaced, config?.propagateErrors].find(
    (value) => typeof value === 'boolean',
  );
  return {
    ...config,
    ...local,
    propagateErrors: propagateErrors ?? false,
    ...(mixedCode
      ? {
          format: 'code',
          language: 'json',
          ':language': undefined,
          convertJson: true,
          propagateErrors: true,
        }
      : {}),
  };
}

export const resolveMonacoLanguage = (
  options: Record<string, unknown> | undefined,
  rootData: unknown,
): string => {
  const path = options?.[':language'];
  if (typeof path === 'string') {
    const resolved = Resolve.data(rootData, path);
    if (typeof resolved === 'string' && resolved) return resolved;
  }
  return typeof options?.language === 'string' && options.language ? options.language : 'plaintext';
};

export const toMonacoEditorValue = (
  value: unknown,
  language: string,
  convertJson: boolean,
): string => {
  if (language === 'json' && convertJson) {
    return value === undefined ? '' : JSON.stringify(value, null, 2);
  }
  return value == null ? '' : typeof value === 'string' ? value : String(value);
};

export const fromMonacoEditorValue = (
  value: string,
  language: string,
  convertJson: boolean,
): { valid: boolean; value: unknown } => {
  if (language === 'json' && convertJson) {
    try {
      return { valid: true, value: JSON.parse(value) };
    } catch {
      return { valid: false, value };
    }
  }
  return { valid: true, value: value || undefined };
};

export const resolveMonacoOptions = (
  options: Record<string, unknown> | undefined,
): MonacoRendererOptions => {
  const profile = options?.monaco;
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) return {};
  const result = { ...profile } as MonacoRendererOptions;
  if (result.options && typeof result.options === 'object' && !Array.isArray(result.options)) {
    const controlled = new Set(['language', 'model', 'theme', 'value']);
    result.options = Object.fromEntries(
      Object.entries(result.options).filter(([key]) => !controlled.has(key)),
    );
  } else {
    delete result.options;
  }
  return result;
};
