import sourceSchema from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-validator-profile/schema.json';
import sourceData from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-validator-profile/data.json';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAjv } from '../../src/lib/core/validate';
import { searchParams } from '../../src/lib/core/dynamicDefaults';

const permission = (allowed: boolean) => ({
  jsonformsExtended: { security: { allowScriptEvaluation: allowed } },
});
const schema = {
  type: 'object',
  dynamicDefaults: {
    greeting: { func: 'dynamic', args: { func: '(args) => args.value', value: 'Hello' } },
  },
};

afterEach(() => vi.restoreAllMocks());

describe('validator-local computed defaults', () => {
  it('isolates validators regardless of registration and compilation order', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const allowed = createAjv(undefined, () => permission(true));
    const denied = createAjv();
    const runAllowed = allowed.compile(schema);
    const runDenied = denied.compile(schema);
    const first = {};
    const second = {};
    runAllowed(first);
    runDenied(second);
    expect(first).toEqual({ greeting: 'Hello' });
    expect(second).toEqual({});
    expect(Object.hasOwn(second, 'greeting')).toBe(false);
  });

  it('rechecks permission for a cached validator, including later grants', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    let config = permission(false);
    const validate = createAjv(undefined, () => config).compile(schema);
    for (const enabled of [false, true, false, true]) {
      config = permission(enabled);
      const data = {};
      validate(data);
      expect(data).toEqual(enabled ? { greeting: 'Hello' } : {});
    }
  });

  it('does not compile denied malformed source and deduplicates diagnostics', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const validate = createAjv().compile({
      type: 'object',
      dynamicDefaults: { value: { func: 'dynamic', args: { func: 'invalid JavaScript {' } } },
    });
    validate({});
    validate({});
    expect(error).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('keeps native providers available and preserves existing values', () => {
    const validate = createAjv().compile({
      type: 'object',
      dynamicDefaults: {
        count: { func: 'randomint', args: { max: 1 } },
        year: { func: 'dateUnit', args: { date: '2020-06-01', unit: 'year' } },
      },
    });
    const data = { count: 7 };
    validate(data);
    expect(data).toEqual({ count: 7, year: 2020 });
    const missing = {};
    validate(missing);
    expect(missing).toEqual({ count: 0, year: 2020 });
  });

  it('reports unavailable browser providers in a server host', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(searchParams({ param: 'q' })()).toBeUndefined();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('searchParamsUnavailable'));
  });
});

it('applies the canonical validator fixture transforms and permitted defaults', () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  for (const enabled of [true, false]) {
    const data = structuredClone(sourceData);
    const validate = createAjv(undefined, () => permission(enabled)).compile(sourceSchema);
    expect(validate(data)).toBe(false);
    expect(data.tidy).toEqual({
      code: 'AB-12',
      town: 'North Harbour',
      note: 'Please seat us together',
      level: 'Intermediate',
    });
    expect(data).toMatchObject({
      defaults: { currency: 'EUR', confirmed: false },
      computed: enabled ? { greeting: 'Welcome, student.' } : {},
    });
    expect(validate.errors?.length).toBeGreaterThan(0);
  }
});
