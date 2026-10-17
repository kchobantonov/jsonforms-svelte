import { isMixedSchema } from './mixedSchema';
import {
  type ControlElement,
  type JsonSchema,
  Paths,
  Resolve,
  type Translator,
  createCleanLabel,
  getI18nKey,
} from '@jsonforms/core';

export interface CompositeSummary {
  text: string;
  /** Generated descriptions use secondary, italic typography instead of data styling. */
  generated: boolean;
}

export const compositeSummaryPresentation = (
  data: unknown,
  summary: ControlElement | undefined,
  title: string | undefined,
  t: Translator,
  message: (key: string, params?: Record<string, unknown>) => string,
  schema?: JsonSchema,
): CompositeSummary => {
  const generated = (text: string): CompositeSummary => ({
    text,
    generated: true,
  });
  const literal = (text: string): CompositeSummary => ({
    text,
    generated: false,
  });
  const usable = (value: unknown) =>
    value != null && typeof value !== 'object' && String(value).trim() !== '';
  if (data == null) return generated(message('composite.summary.unset'));
  if (Array.isArray(data)) {
    if (summary?.scope && data.length) {
      const path = Paths.fromScoped(summary);
      const preview: string[] = [];
      for (const item of data) {
        const value = Resolve.data(item, path);
        if (usable(value)) {
          preview.push(String(value));
          if (preview.length === 2) break;
        }
      }
      if (preview.length) {
        const remaining = data.length - preview.length;
        const more = remaining
          ? ' ' +
            message('composite.summary.more', {
              count: remaining,
            }).replace('{count}', String(remaining))
          : '';
        return literal(preview.join(', ') + more);
      }
    }
    const key = data.length === 1 ? 'composite.summary.item' : 'composite.summary.items';
    return generated(message(key, { count: data.length }).replace('{count}', String(data.length)));
  }
  if (typeof data === 'object') {
    if (Object.keys(data).length === 0) return generated(message('composite.summary.emptyObject'));
    if (summary?.scope) {
      const path = Paths.fromScoped(summary);
      const value = Resolve.data(data, path);
      if (usable(value)) return literal(String(value));
      const fieldSchema = schema ? Resolve.schema(schema, summary.scope, schema) : undefined;
      const fallback =
        typeof summary.label === 'string'
          ? summary.label
          : (fieldSchema?.title ?? (path ? createCleanLabel(path.split('.').pop()!) : title));
      if (fallback) {
        const label = t(getI18nKey(fieldSchema, summary, path, 'label'), fallback);
        return generated(
          message('composite.summary.unspecified', { label }).replace('{label}', label),
        );
      }
    }
    return generated(title ?? message('composite.summary.details'));
  }
  return literal(String(data));
};

/** Explicit Label summaries may present scalar values; ordinary scalar cells keep their own testers. */
export const compositeCellTester: import('@jsonforms/core').RankedTester = (
  ui,
  schema,
  context,
) => {
  if (ui.options?.summary?.type === 'Label') return 6;
  const rootControl: ControlElement = { ...ui, type: 'Control', scope: '#' };
  return schema.type === 'object' ||
    schema.type === 'array' ||
    Boolean(schema.anyOf?.length || schema.oneOf?.length || schema.allOf?.length) ||
    isMixedSchema(rootControl, schema, context)
    ? 1
    : -1;
};
