import dayjs, { type UnitType } from 'dayjs';
import customParsingPlugin from 'dayjs/plugin/customParseFormat';
import durationPlugin from 'dayjs/plugin/duration';
import timezonePlugin from 'dayjs/plugin/timezone'; // dependent on utc plugin
import utcPlugin from 'dayjs/plugin/utc';
import type { UIDiagnosticReporter } from '@chobantonov/jsonforms-svelte';

// required for the custom save formats in the date, time and date-time pickers
dayjs.extend(customParsingPlugin);
dayjs.extend(utcPlugin);
dayjs.extend(timezonePlugin);
dayjs.extend(durationPlugin);

/** Permission is checked at execution too: Ajv caches compiled validators. */
export const makeDynamic =
  (allowed: () => boolean, reportDiagnostic?: UIDiagnosticReporter) =>
  (args?: Record<string, unknown>) => {
    let warned = false;
    let reportedFailure = false;
    let compiled: ((args: unknown) => unknown) | undefined;
    let compiledSource: string | undefined;
    return () => {
      if (!allowed()) {
        compiled = undefined;
        compiledSource = undefined;
        if (!warned)
          (reportDiagnostic ?? console.warn)('script.evaluationDisabled', {
            severity: 'warning',
            message: 'Dynamic default script evaluation is disabled by host policy.',
            details: { capability: 'dynamicDefaults' },
          });
        warned = true;
        return undefined;
      }
      warned = false;
      const source = args?.func;
      if (typeof source !== 'string' || !source) {
        throw new Error("missing argument 'func' for dynamicDefaults func 'dynamic'");
      }
      try {
        if (compiledSource !== source || !compiled) {
          compiled = undefined;
          compiledSource = undefined;
          compiled = new Function('args', `const func = ${source}; return func(args);`) as (
            args: unknown,
          ) => unknown;
          compiledSource = source;
        }
        const value = compiled!(args);
        reportedFailure = false;
        return value;
      } catch {
        if (!reportedFailure)
          (reportDiagnostic ?? console.error)('dynamicDefaults.evaluationFailed', {
            severity: 'error',
            message: 'Dynamic default script evaluation failed.',
            details: { capability: 'dynamicDefaults' },
          });
        reportedFailure = true;
        return undefined;
      }
    };
  };

/** Direct callers are denied unless they explicitly supply a permission getter. */
export const dynamic = (args?: Record<string, unknown>, allowed: () => boolean = () => false) =>
  makeDynamic(allowed)(args);

export const searchParams = (
  args?: Record<string, unknown>,
  reportDiagnostic?: UIDiagnosticReporter,
) => {
  let paramName: string | undefined = undefined;
  if (args?.param && typeof args.param === 'string') {
    paramName = args?.param;
  }

  if (typeof window === 'undefined') {
    (reportDiagnostic ?? console.warn)('dynamicDefaults.searchParamsUnavailable', {
      severity: 'warning',
      message: 'The searchParams dynamic default requires a browser host.',
      details: { provider: 'searchParams' },
    });
    return () => undefined;
  }
  const url: URL = new URL(window.location.href);
  const params: URLSearchParams = url.searchParams;

  let result: string | undefined = undefined;
  if (paramName) {
    if (params.has(paramName)) {
      result = params.get(paramName)!;
    } else {
      // try from the hash #
      const hash = url.hash;
      const index = hash.indexOf('?');
      if (index > 0 && index < hash.length - 1) {
        const hashSearchParams = new URLSearchParams(hash.substring(index + 1));
        if (hashSearchParams.has(paramName)) {
          result = hashSearchParams.get(paramName)!;
        }
      }
    }
  }

  return () => result;
};

export const datetimeOffset = (args?: Record<string, unknown>) => {
  const dateTime = nowOffset(args);
  let result: string | undefined = undefined;

  if (dateTime.isValid()) {
    const datetimeLocalFormat = 'YYYY-MM-DDTHH:mm:ss.SSS';

    result = dateTime.local().format(datetimeLocalFormat);
  }

  return () => result;
};

export const timeOffset = (args?: Record<string, unknown>) => {
  const dateTime = nowOffset(args);
  let result: string | undefined = undefined;

  if (dateTime.isValid()) {
    const datetimeLocalFormat = 'HH:mm:ss.SSS';

    result = dateTime.local().format(datetimeLocalFormat);
  }

  return () => result;
};

export const dateOffset = (args?: Record<string, unknown>) => {
  const date = nowOffset(args);
  let result: string | undefined = undefined;

  if (date.isValid()) {
    result = date.local().format('YYYY-MM-DD');
  }

  return () => result;
};

export const dateUnit = (args?: Record<string, unknown>) => {
  const date = nowOffset(args);
  let result: number | undefined = undefined;

  if (date.isValid()) {
    let unit: UnitType = 'millisecond';
    if (args?.unit && typeof args.unit === 'string') {
      unit = args.unit as UnitType;
    }

    result = date.local().get(unit);
  }

  return () => result;
};

const nowOffset = (args?: Record<string, unknown>) => {
  let duration: string | undefined = undefined;
  if (args?.duration && typeof args.duration === 'string') {
    duration = args?.duration;
  }
  let date: string | Date | undefined = new Date();
  if (args?.date && typeof args.date === 'string') {
    if (args.date !== 'now') {
      // only assign if not the string now
      date = args?.date;
    }
  }
  let operation: 'add' | 'substract' = 'add';
  if (args?.op && args.op === 'substract') {
    operation = 'substract';
  }

  let dateObj = dayjs(date);

  if (dateObj.isValid() && duration) {
    const offset = dayjs.duration(duration);

    dateObj = operation == 'add' ? dateObj.add(offset) : dateObj.subtract(offset);
  }

  return dateObj;
};
