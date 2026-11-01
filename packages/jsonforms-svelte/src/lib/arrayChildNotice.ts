import type { ErrorObject } from 'ajv';
import { errorTargetSegments } from './errorSummary';
import { dataPathSegments } from './dataPath';

/** Exclude direct array errors; stop after the first child unless a count is requested. */
export function arrayChildErrorCount(
  errors: readonly ErrorObject[],
  path: string,
  countAll = true,
): number {
  const depth = dataPathSegments(path).length;
  let count = 0;
  for (const error of errors) {
    if (errorTargetSegments(error).length <= depth) continue;
    count += 1;
    if (!countAll) break;
  }
  return count;
}

/** A short collection-level notice keeps child field errors on their own controls. */
export function arrayChildNotice(
  count: number,
  showCount: boolean,
  message: (key: string, params?: Record<string, unknown>) => string,
): string {
  if (count < 1) return '';
  const key = !showCount
    ? 'validation.childrenErrors'
    : count === 1
      ? 'validation.childrenErrorCount'
      : 'validation.childrenErrorsCount';
  return message(key, { count });
}
