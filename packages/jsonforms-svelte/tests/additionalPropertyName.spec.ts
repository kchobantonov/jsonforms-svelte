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
      pattern: '^item-',
    });
  });
});
