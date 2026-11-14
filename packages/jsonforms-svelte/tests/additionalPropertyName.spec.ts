import { createAjv, type JsonSchema } from '@jsonforms/core';
import { describe, expect, it } from 'vite-plus/test';
import {
  createAdditionalPropertyNameSchema,
  validateAdditionalPropertyName,
} from '../src/lib/additionalPropertyName';

const rootSchema: JsonSchema = {
  type: 'object',
};

describe('validateAdditionalPropertyName', () => {
  it.each(['profile.name'])('rejects the JSON Forms path characters in "%s"', (name) => {
    expect(
      validateAdditionalPropertyName({
        name,
        schema: { type: 'object', additionalProperties: true },
        rootSchema,
      }),
    ).toEqual({
      valid: false,
      name,
      error: 'invalid',
    });
  });

  it('normalizes names and rejects existing, schema-defined, and disallowed names', () => {
    const schema: JsonSchema = {
      type: 'object',
      properties: {
        fixed: { type: 'string' },
      },
      additionalProperties: true,
    };

    expect(
      validateAdditionalPropertyName({
        name: ' existing ',
        schema,
        rootSchema,
        data: { existing: true },
      }),
    ).toMatchObject({ valid: false, name: 'existing', error: 'already-defined' });
    expect(
      validateAdditionalPropertyName({
        name: 'fixed',
        schema,
        rootSchema,
      }),
    ).toMatchObject({ valid: false, error: 'already-defined' });
    expect(
      validateAdditionalPropertyName({
        name: 'blocked',
        schema,
        rootSchema,
        disallowedPropertyNames: ['blocked'],
      }),
    ).toMatchObject({ valid: false, error: 'already-defined' });
  });

  it('allows an unchanged current name', () => {
    expect(
      validateAdditionalPropertyName({
        name: 'nickname',
        currentName: 'nickname',
        schema: { type: 'object', additionalProperties: true },
        rootSchema,
        data: { nickname: 'Ada' },
      }),
    ).toEqual({
      valid: true,
      name: 'nickname',
    });
  });

  it('validates the complete propertyNames schema, including resolved references', () => {
    const schema: JsonSchema = {
      type: 'object',
      propertyNames: {
        $ref: '#/$defs/propertyName',
      },
      additionalProperties: true,
    } as JsonSchema;
    const schemaRoot = {
      ...schema,
      $defs: {
        propertyName: {
          type: 'string',
          pattern: '^[a-z]+$',
          minLength: 4,
        },
      },
    } as unknown as JsonSchema;
    const ajv = createAjv();

    expect(
      validateAdditionalPropertyName({
        name: 'abc',
        schema,
        rootSchema: schemaRoot,
        ajv,
      }),
    ).toMatchObject({ valid: false, error: 'invalid' });
    expect(
      validateAdditionalPropertyName({
        name: 'valid',
        schema,
        rootSchema: schemaRoot,
        ajv,
      }),
    ).toEqual({ valid: true, name: 'valid' });
  });

  it.each([
    ['sensor-z', ['minLength']],
    ['senso', ['minLength', 'pattern']],
    ['reading-deck', ['pattern']],
  ] as const)('keeps the specific failed name constraints for %s', (name, keywords) => {
    const schema = {
      type: 'object',
      propertyNames: { pattern: '^sensor-', minLength: 9 },
      additionalProperties: { type: 'number' },
    } as JsonSchema;
    for (const ajv of [undefined, createAjv()]) {
      const result = validateAdditionalPropertyName({
        name,
        currentName: 'sensor-x',
        schema,
        rootSchema: schema,
        data: { 'sensor-x': 9.1 },
        ajv,
        allowLiteralNames: true,
      });
      expect(result).toMatchObject({ valid: false, error: 'invalid' });
      if (!result.valid)
        expect(result.errors?.map((error) => error.keyword).sort()).toEqual([...keywords].sort());
    }
  });

  it('preserves a host-only propertyNames failure in the name preview', () => {
    const schema = {
      type: 'object',
      propertyNames: { hostNameRule: true },
      additionalProperties: true,
    } as JsonSchema;
    const hostError = {
      instancePath: '',
      schemaPath: '#/allOf/0/hostNameRule',
      keyword: 'hostNameRule',
      params: {},
      message: 'must start with the host prefix',
    };
    const result = validateAdditionalPropertyName({
      name: 'draft',
      schema,
      rootSchema: schema,
      ajv: { validate: () => false, errors: [hostError] } as never,
    });
    expect(result).toEqual({
      valid: false,
      name: 'draft',
      error: 'invalid',
      errors: [hostError],
    });
  });

  it('recovers ordinary constraint details when the host only returns false', () => {
    const schema = {
      type: 'object',
      propertyNames: { minLength: 5 },
      additionalProperties: true,
    } as JsonSchema;
    const result = validateAdditionalPropertyName({
      name: 'abc',
      schema,
      rootSchema: schema,
      ajv: { validate: () => false } as never,
    });
    expect(result).toMatchObject({ valid: false, error: 'invalid' });
    if (!result.valid)
      expect(result.errors?.some((error) => error.keyword === 'minLength')).toBe(true);
  });

  it('requires both propertyNames and an allowed pattern when additional properties are disabled', () => {
    const schema = {
      type: 'object',
      propertyNames: {
        pattern: '^(string|number)_[A-Za-z0-9_]+$',
      },
      patternProperties: {
        '^string_': { type: 'string' },
        '^number_': { type: 'number' },
      },
      additionalProperties: false,
    } as JsonSchema;
    const ajv = createAjv();

    expect(
      validateAdditionalPropertyName({ name: 'string_title', schema, rootSchema, ajv }),
    ).toEqual({ valid: true, name: 'string_title' });
    expect(
      validateAdditionalPropertyName({ name: 'number_count', schema, rootSchema, ajv }),
    ).toEqual({ valid: true, name: 'number_count' });
    expect(
      validateAdditionalPropertyName({ name: 'wrong_name', schema, rootSchema, ajv }),
    ).toMatchObject({ valid: false, error: 'invalid' });
    expect(
      validateAdditionalPropertyName({ name: 'string-invalid', schema, rootSchema, ajv }),
    ).toMatchObject({ valid: false, error: 'invalid' });
  });

  it('rejects every name when propertyNames is false', () => {
    const schema = {
      type: 'object',
      propertyNames: false,
      additionalProperties: true,
    } as unknown as JsonSchema;

    expect(
      validateAdditionalPropertyName({ name: 'anything', schema, rootSchema, ajv: createAjv() }),
    ).toMatchObject({ valid: false, error: 'invalid' });
  });

  it('keeps the name preview usable when its schema or host validator cannot compile', () => {
    const malformed = {
      type: 'object',
      propertyNames: { pattern: '[' },
      additionalProperties: true,
    } as JsonSchema;
    expect(
      validateAdditionalPropertyName({ name: 'draft', schema: malformed, rootSchema: malformed }),
    ).toEqual({ valid: true, name: 'draft' });
    expect(
      validateAdditionalPropertyName({
        name: 'draft',
        schema: { type: 'object', additionalProperties: true },
        rootSchema,
        ajv: {
          validate: () => {
            throw new Error('host validator unavailable');
          },
        } as never,
      }),
    ).toEqual({ valid: true, name: 'draft' });
  });
});

describe('createAdditionalPropertyNameSchema', () => {
  it('honors a propertyNames reference to a boolean schema', () => {
    const root = {
      definitions: { open: true, closed: false },
    } as unknown as JsonSchema;
    for (const [target, expected] of [
      ['open', true],
      ['closed', false],
    ] as const) {
      const nameSchema = createAdditionalPropertyNameSchema(
        { type: 'object', propertyNames: { $ref: `#/definitions/${target}` } },
        root,
      );
      expect(createAjv().validate(nameSchema, 'candidate')).toBe(expected);
    }
  });
  it('uses patternProperties when additional properties are disabled', () => {
    expect(
      createAdditionalPropertyNameSchema(
        {
          type: 'object',
          additionalProperties: false,
          patternProperties: {
            '^item-': { type: 'string' },
          },
        },
        rootSchema,
      ),
    ).toEqual({
      type: 'string',
      allOf: [
        {
          anyOf: [{ pattern: '^item-' }],
        },
      ],
    });
  });

  it('distinguishes a rejected pattern name from other invalid names', () => {
    const schema = {
      type: 'object',
      additionalProperties: false,
      patternProperties: { '^item-': { type: 'string' } },
    } as JsonSchema;
    expect(
      validateAdditionalPropertyName({ name: 'other', schema, rootSchema: schema }),
    ).toMatchObject({ valid: false, error: 'invalid', reason: 'pattern' });
    expect(
      validateAdditionalPropertyName({ name: 'item-next', schema, rootSchema: schema }),
    ).toEqual({ valid: true, name: 'item-next' });
  });

  it('keeps a matching name available when its value schema is false', () => {
    const schema = {
      type: 'object',
      additionalProperties: false,
      patternProperties: { '^blocked-': false },
    } as unknown as JsonSchema;

    expect(
      validateAdditionalPropertyName({ name: 'blocked-item', schema, rootSchema: schema }),
    ).toEqual({ valid: true, name: 'blocked-item' });
    expect(createAjv().validate(schema, { 'blocked-item': '' })).toBe(false);
  });

  it('rejects every additional property name when additional properties are disabled without patterns', () => {
    const nameSchema = createAdditionalPropertyNameSchema(
      {
        type: 'object',
        additionalProperties: false,
      },
      rootSchema,
    );

    expect(nameSchema).toEqual({
      type: 'string',
      allOf: [{ not: {} }],
    });
    expect(createAjv().validate(nameSchema, 'anything')).toBe(false);
  });

  it('composes propertyNames with all allowed pattern-property names', () => {
    expect(
      createAdditionalPropertyNameSchema(
        {
          type: 'object',
          propertyNames: { minLength: 4 },
          additionalProperties: false,
          patternProperties: {
            '^string_': { type: 'string' },
            '^number_': { type: 'number' },
          },
        },
        rootSchema,
      ),
    ).toEqual({
      type: 'string',
      allOf: [
        { minLength: 4 },
        {
          anyOf: [{ pattern: '^string_' }, { pattern: '^number_' }],
        },
      ],
    });
  });

  it('preserves an incompatible propertyNames type instead of overwriting it', () => {
    const nameSchema = createAdditionalPropertyNameSchema(
      {
        type: 'object',
        propertyNames: { type: 'number' },
      },
      rootSchema,
    );

    expect(createAjv().validate(nameSchema, 'field')).toBe(false);
  });
});

it.each(['profile[name]', 'profile]name[', '15'])('accepts literal property name %s', (name) => {
  expect(
    validateAdditionalPropertyName({
      name,
      schema: { type: 'object', additionalProperties: true },
      rootSchema,
    }),
  ).toEqual({ valid: true, name });
});

it.each(['', '  spaced  ', 'a.b', '__proto__', 'a/b~c', 'a\u0000b'])(
  'preserves exact literal name %j when the caller supports parent writes',
  (name) => {
    expect(
      validateAdditionalPropertyName({
        name,
        allowLiteralNames: true,
        allowEmptyPropertyNames: true,
        schema: { type: 'object', additionalProperties: true },
        rootSchema,
        ajv: createAjv(),
      }),
    ).toEqual({ valid: true, name });
  },
);
it('still checks schema rules and exact duplicate names in literal mode', () => {
  expect(
    validateAdditionalPropertyName({
      name: '',
      allowLiteralNames: true,
      allowEmptyPropertyNames: true,
      schema: { propertyNames: { minLength: 1 } },
      rootSchema,
      ajv: createAjv(),
    }).valid,
  ).toBe(false);
  expect(
    validateAdditionalPropertyName({
      name: 'a.b',
      allowLiteralNames: true,
      schema: {},
      rootSchema,
      data: { 'a.b': 1 },
    }),
  ).toMatchObject({ valid: false, error: 'already-defined' });
});

it('validates an imported current name when the rename draft is unchanged', () => {
  const schema = {
    type: 'object',
    propertyNames: { pattern: '^sensor-', minLength: 9 },
    additionalProperties: { type: 'number' },
  } as JsonSchema;
  const data = { 'sensor-x': 9.1 };
  const ajv = createAjv();
  expect(
    validateAdditionalPropertyName({
      name: 'sensor-x',
      currentName: 'sensor-x',
      schema,
      rootSchema: schema,
      data,
      ajv,
    }),
  ).toMatchObject({ valid: false, error: 'invalid' });
  expect(
    validateAdditionalPropertyName({
      name: 'sensor-deck-a',
      currentName: 'sensor-deck-a',
      schema,
      rootSchema: schema,
      data: { 'sensor-deck-a': 4.5 },
      ajv,
    }),
  ).toEqual({ valid: true, name: 'sensor-deck-a' });
});

it('keeps every failed name constraint for translated rename feedback', () => {
  const schema = {
    type: 'object',
    propertyNames: { pattern: '^sensor-', minLength: 9 },
  } as JsonSchema;
  const ajv = createAjv();
  const validate = (name: string) =>
    validateAdditionalPropertyName({ name, schema, rootSchema: schema, ajv });

  const short = validate('sensor-z');
  expect(short.valid).toBe(false);
  if (short.valid) return;
  expect(short.errors?.map((error) => error.keyword)).toEqual(['minLength']);

  const wrongPrefix = validate('senso');
  expect(wrongPrefix.valid).toBe(false);
  if (wrongPrefix.valid) return;
  expect(wrongPrefix.errors?.map((error) => error.keyword)).toEqual(['minLength', 'pattern']);

  const patternOnly = validate('reading-deck');
  expect(patternOnly.valid).toBe(false);
  if (patternOnly.valid) return;
  expect(patternOnly.errors?.map((error) => error.keyword)).toEqual(['pattern']);

  const withoutHostAjv = validateAdditionalPropertyName({
    name: 'senso',
    schema,
    rootSchema: schema,
  });
  expect(withoutHostAjv.valid).toBe(false);
  if (withoutHostAjv.valid) return;
  expect(withoutHostAjv.errors?.map((error) => error.keyword)).toEqual(['minLength', 'pattern']);
});

it.each(['', '   '])('requires explicit opt-in for blank literal name %j', (name) => {
  const options = { name, schema: rootSchema, rootSchema, allowLiteralNames: true };
  expect(validateAdditionalPropertyName(options).valid).toBe(false);
  expect(
    validateAdditionalPropertyName({ ...options, allowEmptyPropertyNames: true }),
  ).toMatchObject({ valid: true, name });
});
