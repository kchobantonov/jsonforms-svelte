import { createAjv, isVisible, RuleEffect, type UISchemaElement } from '@jsonforms/core';
import { describe, expect, it } from 'vite-plus/test';
import { ruleValidationAjv, ruleValidationElement } from './ruleValidation';

describe('isolated schema rule validation', () => {
  it('validates defaults on a copy while ordinary validation still assigns them', () => {
    const ajv = createAjv({ useDefaults: true });
    const schema = {
      type: 'object',
      properties: { count: { type: 'number', default: 3 } },
      required: ['count'],
    };
    const data = {};
    const rule = {
      type: 'Control',
      rule: { effect: RuleEffect.SHOW, condition: { scope: '#', schema } },
    } as UISchemaElement;
    expect(isVisible(rule, data, '', ruleValidationAjv(ajv), {})).toBe(true);
    expect(data).toEqual({});
    expect(ajv.validate(schema, data)).toBe(true);
    expect(data).toEqual({ count: 3 });
  });

  it('retains host references, formats and mutation keywords without leaking changes', () => {
    const ajv = createAjv();
    ajv.addFormat('host-code', /^OK$/);
    ajv.addKeyword({
      keyword: 'normalize',
      modifying: true,
      validate: (_schema: unknown, data: Record<string, unknown>) => {
        data.code = 'OK';
        return true;
      },
    });
    ajv.addSchema({
      $id: 'host-rule',
      type: 'object',
      allOf: [
        { normalize: true },
        { properties: { code: { type: 'string', format: 'host-code' } } },
      ],
    });
    const data = { code: 'before' };
    const isolated = ruleValidationAjv(ajv);
    expect(isolated.validate('host-rule', data)).toBe(true);
    expect(data).toEqual({ code: 'before' });
    expect(ruleValidationAjv(ajv)).toBe(isolated);
    expect(ruleValidationAjv(isolated)).toBe(isolated);
  });

  it('leaves nested values and failed conditions unchanged', () => {
    const ajv = createAjv({ useDefaults: true });
    const data = { nested: {} };
    expect(
      ruleValidationAjv(ajv).validate(
        {
          type: 'object',
          properties: {
            nested: { type: 'object', properties: { value: { default: 1 } } },
            missing: { type: 'string' },
          },
          required: ['missing'],
        },
        data,
      ),
    ).toBe(false);
    expect(data).toEqual({ nested: {} });
  });
});

it('isolates predicate data and fullData while preserving their shared identity', () => {
  const data = { value: 'original' };
  const element = {
    type: 'Control',
    rule: {
      effect: RuleEffect.SHOW,
      condition: {
        scope: '#',
        validate: (context: { data: unknown; fullData: unknown }) => {
          expect(context.data).toBe(context.fullData);
          (context.data as { value: string }).value = 'changed';
          return true;
        },
      },
    },
  };
  expect(isVisible(ruleValidationElement(element), data, '', createAjv(), {})).toBe(true);
  expect(data).toEqual({ value: 'original' });
});

it('supports JSON Forms root schema reference conditions', () => {
  const ajv = createAjv({ useDefaults: true });
  ajv.addSchema(
    {
      definitions: {
        condition: {
          type: 'object',
          properties: { injected: { default: 1 } },
          required: ['injected'],
        },
      },
    },
    '/',
  );
  const data = {};
  expect(ruleValidationAjv(ajv).validate({ $ref: '/#/definitions/condition' }, data)).toBe(true);
  expect(data).toEqual({});
});

it('isolates compiled composition probes and preserves validator errors', () => {
  const ajv = createAjv({ useDefaults: true });
  const schema = {
    $id: 'composition-probe',
    type: 'object',
    properties: { added: { default: 1 } },
    required: ['missing'],
  };
  ajv.addSchema(schema);
  const probe = ruleValidationAjv(ajv).compile(schema);
  const data = {};
  expect(probe(data)).toBe(false);
  expect(probe.errors?.[0].keyword).toBe('required');
  expect(data).toEqual({});
  expect(ruleValidationAjv(ajv).getSchema('composition-probe')).toBe(probe);
  expect(ajv.getSchema('composition-probe')!(data)).toBe(false);
  expect(data).toEqual({ added: 1 });
});

it.each(['oneOf', 'anyOf', 'allOf'] as const)(
  'keeps %s branch selection from inserting defaults',
  async (keyword) => {
    const { mapStateToAllOfProps, mapStateToAnyOfProps, mapStateToOneOfProps } =
      await import('@jsonforms/core');
    const { ruleValidationState } = await import('./ruleValidation');
    const ajv = createAjv({ useDefaults: true });
    const data = { kind: 'second' };
    const schema = {
      type: 'object',
      [keyword]: [
        {
          type: 'object',
          properties: { kind: { const: 'first' }, leaked: { default: 'from first branch' } },
        },
        { type: 'object', properties: { kind: { const: 'second' } } },
      ],
    };
    const uischema = { type: 'Control' as const, scope: '#' };
    const state = { jsonforms: { core: { data, schema, uischema, errors: [], ajv } } };
    const mapper = {
      oneOf: mapStateToOneOfProps,
      anyOf: mapStateToAnyOfProps,
      allOf: mapStateToAllOfProps,
    }[keyword];
    const mapped = mapper(ruleValidationState(state), { schema, uischema, path: '' });
    expect(mapped.indexOfFittingSchema).toBe(1);
    expect(mapped.data).toBe(data);
    expect(data).toEqual({ kind: 'second' });
  },
);
