import dayjs, { type UnitType } from 'dayjs';
import customParsingPlugin from 'dayjs/plugin/customParseFormat';
import durationPlugin from 'dayjs/plugin/duration';
import timezonePlugin from 'dayjs/plugin/timezone'; // dependent on utc plugin
import utcPlugin from 'dayjs/plugin/utc';

// required for the custom save formats in the date, time and date-time pickers
dayjs.extend(customParsingPlugin);
dayjs.extend(utcPlugin);
dayjs.extend(timezonePlugin);
dayjs.extend(durationPlugin);

/** Permission is checked at execution too: Ajv caches compiled validators. */
export const makeDynamic = (allowed: () => boolean) => (args?: Record<string, unknown>) => {
  let warned = false;
  let compiled: ((args: unknown) => unknown) | undefined;
  return () => {
    if (!allowed()) {
      if (!warned)
        console.warn(
          'dynamicDefaults.evaluationDisabled: requires jsonformsExtended.security.allowScriptEvaluation',
        );
      warned = true;
      return undefined;
    }
    warned = false;
    if (typeof args?.func !== 'string' || !args.func) {
      throw new Error("missing argument 'func' for dynamicDefaults func 'dynamic'");
    }
    try {
      compiled ??= new Function('args', `const func = ${args.func}; return func(args);`) as (
        args: unknown,
      ) => unknown;
      return compiled(args);
    } catch (error) {
      console.error(`Error at dynamicDefaults 'dynamic': ${error}`);
      return undefined;
    }
  };
};

/** Direct callers are denied unless they explicitly supply a permission getter. */
export const dynamic = (args?: Record<string, unknown>, allowed: () => boolean = () => false) =>
  makeDynamic(allowed)(args);

export const searchParams = (args?: Record<string, unknown>) => {
  let paramName: string | undefined = undefined;
  if (args?.param && typeof args.param === 'string') {
    paramName = args?.param;
  }

  if (typeof window === 'undefined') {
    console.warn('dynamicDefaults.searchParamsUnavailable: requires a browser host');
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
