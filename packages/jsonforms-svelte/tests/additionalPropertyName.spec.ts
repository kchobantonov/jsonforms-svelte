import { createAjv, type JsonSchema } from '@jsonforms/core';
import { describe, expect, it } from 'vitest';
import {
  createAdditionalPropertyNameSchema,
  validateAdditionalPropertyName,
} from '../src/lib/additionalPropertyName';

const rootSchema: JsonSchema = {
  type: 'object',
};

describe('validateAdditionalPropertyName', () => {
  it.each(['profile.name', 'profile[name]', 'profile]name['])(
    'rejects the JSON Forms path characters in "%s"',
    (name) => {
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
    },
  );

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
});

describe('createAdditionalPropertyNameSchema', () => {
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
