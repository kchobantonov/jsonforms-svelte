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
  const constraints: JsonSchema7[] = [];
  const propertyNames = (schema as JsonSchema7 & { propertyNames?: JsonSchema7 | boolean })
    .propertyNames;

  if (propertyNames === false) {
    // JSON Forms' JsonSchema7 type does not model boolean schemas, so express
    // the equivalent always-false schema with `not: {}`.
    constraints.push({ not: {} });
  } else if (typeof propertyNames === 'object' && propertyNames !== null) {
    const resolvedPropertyNames =
      typeof propertyNames.$ref === 'string'
        ? ((Resolve.schema(rootSchema, propertyNames.$ref, rootSchema) as
            | JsonSchema7
            | undefined) ?? propertyNames)
        : propertyNames;

    constraints.push(resolvedPropertyNames);
  }

  if (schema.additionalProperties === false) {
    const patterns = Object.keys(schema.patternProperties ?? {});
    constraints.push(
      patterns.length > 0
        ? {
            anyOf: patterns.map((pattern) => ({ pattern })),
          }
        : { not: {} },
    );
  }

  return {
    type: 'string',
    ...(constraints.length > 0 ? { allOf: constraints } : {}),
  };
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
