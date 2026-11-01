import { createAjv, isEnabled, isVisible, RuleEffect, type UISchemaElement } from '@jsonforms/core';
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

it('evaluates literal dotted and empty rule scopes without treating them as nested paths', () => {
  const ajv = createAjv();
  ajv.addFormat('host-rule-token', /^yes$/);
  const data = {
    items: [{ 'a.b': 'yes', '': 0, 'a~b~c': 'tilde', 'a~b~0c': 'decoy', a: { b: 'no' } }],
  };
  const visible = (condition: Record<string, unknown>) =>
    isVisible(
      ruleValidationElement(
        { type: 'Control', rule: { effect: RuleEffect.SHOW, condition } } as UISchemaElement,
        ajv,
      ),
      data,
      'items.0',
      ruleValidationAjv(ajv),
      {},
    );
  expect(visible({ scope: '#/properties/a.b', schema: { const: 'yes' } })).toBe(true);
  expect(
    visible({ scope: '#/properties/a.b', schema: { type: 'string', format: 'host-rule-token' } }),
  ).toBe(true);
  expect(visible({ scope: '#/properties/a.b', schema: { const: 'no' } })).toBe(false);
  expect(visible({ scope: '#/properties/', schema: { const: 0 } })).toBe(true);
  expect(visible({ scope: '#/properties/a~0b~0c', schema: { const: 'tilde' } })).toBe(true);
  expect(
    visible({
      type: 'OR',
      conditions: [
        { scope: '#/properties/a.b', schema: { const: 'no' } },
        { type: 'LEAF', scope: '#/properties/', expectedValue: 0 },
      ],
    }),
  ).toBe(true);
  expect(visible({ scope: '#/properties/a.b', schema: {}, failWhenUndefined: true })).toBe(true);
  expect(visible({ scope: '#/properties/missing.key', schema: {}, failWhenUndefined: true })).toBe(
    false,
  );
});

it('preserves literal leaf, composed and predicate rules without mutating source data', () => {
  const ajv = createAjv();
  const data = { 'a.b': { value: 1 }, nested: { value: 2 } };
  const rule = {
    type: 'Control',
    rule: {
      effect: RuleEffect.ENABLE,
      condition: {
        type: 'AND',
        conditions: [
          { type: 'LEAF', scope: '#/properties/a.b/properties/value', expectedValue: 1 },
          {
            scope: '#/properties/a.b',
            validate: ({ data: scoped, fullData }: { data: unknown; fullData: unknown }) => {
              (scoped as { value: number }).value = 9;
              (fullData as Record<string, unknown>).nested = null;
              return true;
            },
          },
          { scope: '#/properties/nested/properties/value', schema: { const: 2 } },
        ],
      },
    },
  } as UISchemaElement;
  expect(isEnabled(ruleValidationElement(rule, ajv), data, '', ruleValidationAjv(ajv), {})).toBe(
    true,
  );
  expect(data).toEqual({ 'a.b': { value: 1 }, nested: { value: 2 } });
});

it('reads prototype-looking literal rule keys only when they are own properties', () => {
  const ajv = createAjv();
  const data = Object.create({ 'inherited.key': 'decoy' }) as Record<string, unknown>;
  Object.defineProperty(data, '__proto__.key', { value: 'own', enumerable: true });
  const rule = (scope: string) =>
    ruleValidationElement(
      {
        type: 'Control',
        rule: { effect: RuleEffect.SHOW, condition: { scope, schema: { const: 'own' } } },
      } as UISchemaElement,
      ajv,
    );
  expect(isVisible(rule('#/properties/__proto__.key'), data, '', ajv, {})).toBe(true);
  expect(isVisible(rule('#/properties/inherited.key'), data, '', ajv, {})).toBe(false);
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
