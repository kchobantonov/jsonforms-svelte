import { Resolve, createAjv, type JsonSchema, type JsonSchema7 } from '@jsonforms/core';
import type Ajv from 'ajv';
import type { ErrorObject } from 'ajv';

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
      errors?: ErrorObject[];
    };

export interface ValidateAdditionalPropertyNameOptions {
  name: string;
  /** Caller edits literal keys by replacing the parent object. */
  allowLiteralNames?: boolean;
  allowEmptyPropertyNames?: boolean;
  schema: JsonSchema;
  rootSchema: JsonSchema;
  data?: unknown;
  currentName?: string;
  disallowedPropertyNames?: readonly string[];
  ajv?: Pick<Ajv, 'validate'> & Partial<Pick<Ajv, 'errors'>>;
}

export const hasUnsupportedPropertyPathCharacters = (name: string): boolean => name.includes('.');

const nameErrorValidator = createAjv();

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
  allowLiteralNames = false,
  allowEmptyPropertyNames = false,
  schema,
  rootSchema,
  data,
  currentName,
  disallowedPropertyNames = [],
  ajv,
}: ValidateAdditionalPropertyNameOptions): AdditionalPropertyNameValidationResult => {
  const normalizedName = allowLiteralNames ? name : name.trim();

  if (!allowEmptyPropertyNames && name.trim().length === 0) {
    return {
      valid: false,
      name: normalizedName,
      error: 'required',
    };
  }

  const reservedPropertyNames = [
    ...Object.keys(schema.properties ?? {}),
    ...disallowedPropertyNames,
  ];
  const isAlreadyDefined =
    normalizedName !== currentName &&
    (reservedPropertyNames.includes(normalizedName) ||
      (typeof data === 'object' &&
        data !== null &&
        !Array.isArray(data) &&
        Object.prototype.hasOwnProperty.call(data, normalizedName)));

  if (isAlreadyDefined) {
    return {
      valid: false,
      name: normalizedName,
      error: 'already-defined',
    };
  }

  const propertyNameSchema = createAdditionalPropertyNameSchema(schema, rootSchema);
  let hasValidSchemaName = true;
  try {
    hasValidSchemaName = (ajv ?? nameErrorValidator).validate(
      propertyNameSchema,
      normalizedName,
    ) as boolean;
  } catch {
    // A malformed name schema or unavailable host keyword cannot be previewed.
    // Keep the draft interaction usable; the form validator owns schema errors.
  }
  let constraintErrors: ErrorObject[] | undefined;
  if (hasValidSchemaName === false) {
    // Host-specific formats and keywords may not exist in the common Ajv.
    // Use the errors from the validator that made the decision when available.
    const hostErrors = (ajv ?? nameErrorValidator).errors;
    if (hostErrors?.length) {
      constraintErrors = [...hostErrors];
    } else if (ajv) {
      // A host hook may only expose `validate`; retain ordinary keyword
      // details from the common validator when it can compile the schema.
      try {
        nameErrorValidator.validate(propertyNameSchema, normalizedName);
        constraintErrors = [...(nameErrorValidator.errors ?? [])];
      } catch {
        // The host's invalid result still prevents the rename.
      }
    }
  }

  if (
    (!allowLiteralNames && hasUnsupportedPropertyPathCharacters(normalizedName)) ||
    hasValidSchemaName === false
  ) {
    return {
      valid: false,
      name: normalizedName,
      error: 'invalid',
      ...(constraintErrors?.length ? { errors: constraintErrors } : {}),
    };
  }

  return {
    valid: true,
    name: normalizedName,
  };
};
