import { Resolve, type JsonSchema, type JsonSchema7 } from '@jsonforms/core';
import type Ajv from 'ajv';

export type AdditionalPropertyNameValidationError = 'required' | 'already-defined' | 'invalid';

export type AdditionalPropertyNameValidationResult =
  | {
      valid: true;
      name: string;
    }
  | {
      valid: false;
      name: string;
      error: AdditionalPropertyNameValidationError;
    };

export interface ValidateAdditionalPropertyNameOptions {
  name: string;
  schema: JsonSchema;
  rootSchema: JsonSchema;
  data?: unknown;
  currentName?: string;
  disallowedPropertyNames?: readonly string[];
  ajv?: Pick<Ajv, 'validate'>;
}

export const hasUnsupportedPropertyPathCharacters = (name: string): boolean =>
  name.includes('[') || name.includes(']') || name.includes('.');

export const createAdditionalPropertyNameSchema = (
  schema: JsonSchema,
  rootSchema: JsonSchema,
): JsonSchema7 => {
  let result: JsonSchema7 = {
    type: 'string',
  };
  const propertyNames = (schema as JsonSchema7).propertyNames;

  if (typeof propertyNames === 'object') {
    const resolvedPropertyNames =
      typeof propertyNames.$ref === 'string'
        ? ((Resolve.schema(rootSchema, propertyNames.$ref, rootSchema) as
            | JsonSchema7
            | undefined) ?? propertyNames)
        : propertyNames;

    result = {
      ...resolvedPropertyNames,
      ...result,
    };
  } else if (
    schema.additionalProperties === false &&
    typeof schema.patternProperties === 'object'
  ) {
    const patterns = Object.keys(schema.patternProperties);
    if (patterns.length > 0) {
      result = {
        pattern: patterns.join('|'),
        ...result,
      };
    }
  }

  return result;
};

export const validateAdditionalPropertyName = ({
  name,
  schema,
  rootSchema,
  data,
  currentName,
  disallowedPropertyNames = [],
  ajv,
}: ValidateAdditionalPropertyNameOptions): AdditionalPropertyNameValidationResult => {
  const normalizedName = name.trim();

  if (!normalizedName) {
    return {
      valid: false,
      name: normalizedName,
      error: 'required',
    };
  }

  if (normalizedName === currentName) {
    return {
      valid: true,
      name: normalizedName,
    };
  }

  const reservedPropertyNames = [
    ...Object.keys(schema.properties ?? {}),
    ...disallowedPropertyNames,
  ];
  const isAlreadyDefined =
    reservedPropertyNames.includes(normalizedName) ||
    (typeof data === 'object' &&
      data !== null &&
      !Array.isArray(data) &&
      Object.prototype.hasOwnProperty.call(data, normalizedName));

  if (isAlreadyDefined) {
    return {
      valid: false,
      name: normalizedName,
      error: 'already-defined',
    };
  }

  const propertyNameSchema = createAdditionalPropertyNameSchema(schema, rootSchema);
  const hasValidSchemaName = ajv?.validate(propertyNameSchema, normalizedName) ?? true;

  if (hasUnsupportedPropertyPathCharacters(normalizedName) || hasValidSchemaName === false) {
    return {
      valid: false,
      name: normalizedName,
      error: 'invalid',
    };
  }

  return {
    valid: true,
    name: normalizedName,
  };
};
