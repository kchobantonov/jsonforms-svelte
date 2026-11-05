import sourceSchema from '@chobantonov/jsonforms-extended-spec/examples/validator-profile/schema.json';
import sourceData from '@chobantonov/jsonforms-extended-spec/examples/validator-profile/data.json';
import { emitUIDiagnostic, type UIDiagnosticReporter } from '@chobantonov/jsonforms-svelte';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { createAjv } from '../../src/lib/core/validate';
import { makeDynamic, searchParams } from '../../src/lib/core/dynamicDefaults';

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
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const host = vi.fn();
    const reported = vi.fn<UIDiagnosticReporter>((code, payload) =>
      emitUIDiagnostic(host, code, payload),
    );
    let config = permission(false);
    const validate = createAjv(undefined, () => config, [], 'draft-07', reported).compile(schema);
    for (const enabled of [false, true, false, true]) {
      config = permission(enabled);
      const data = {};
      validate(data);
      expect(data).toEqual(enabled ? { greeting: 'Hello' } : {});
    }
    expect(warn.mock.calls.filter(([code]) => code === 'script.evaluationDisabled')).toHaveLength(
      2,
    );
    expect(reported).toHaveBeenCalledTimes(2);
    expect(host).toHaveBeenCalledTimes(2);
    expect(reported).toHaveBeenCalledWith('script.evaluationDisabled', {
      severity: 'warning',
      message: 'Dynamic default script evaluation is disabled by host policy.',
      details: { capability: 'dynamicDefaults' },
    });
  });

  it('drops compiled dynamic code on revocation and follows the current source after a grant', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const args = { func: '(args) => args.value', value: 'first' };
    let allowed = true;
    const run = makeDynamic(() => allowed)(args);
    expect(run()).toBe('first');
    allowed = false;
    expect(run()).toBeUndefined();
    args.func = '(args) => args.value.toUpperCase()';
    args.value = 'second';
    allowed = true;
    expect(run()).toBe('SECOND');
    args.func = '(args) => args.value + "!"';
    expect(run()).toBe('second!');
    expect(
      warning.mock.calls.filter(([code]) => code === 'script.evaluationDisabled'),
    ).toHaveLength(1);
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
    expect(warn).toHaveBeenCalledExactlyOnceWith('script.evaluationDisabled', {
      severity: 'warning',
      message: 'Dynamic default script evaluation is disabled by host policy.',
      details: { capability: 'dynamicDefaults' },
    });
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
    expect(warn).toHaveBeenCalledExactlyOnceWith('dynamicDefaults.searchParamsUnavailable', {
      severity: 'warning',
      message: 'The searchParams dynamic default requires a browser host.',
      details: { provider: 'searchParams' },
    });
  });

  it('reports permitted script failures without logging source text', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const validate = createAjv(undefined, () => permission(true)).compile({
      type: 'object',
      dynamicDefaults: {
        value: { func: 'dynamic', args: { func: 'privateExpression invalid JavaScript {' } },
      },
    });
    const data = {};
    validate(data);
    validate(data);
    expect(data).toEqual({});
    expect(error).toHaveBeenCalledExactlyOnceWith('dynamicDefaults.evaluationFailed', {
      severity: 'error',
      message: 'Dynamic default script evaluation failed.',
      details: { capability: 'dynamicDefaults' },
    });
    expect(JSON.stringify(error.mock.calls)).not.toContain('privateExpression');
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
