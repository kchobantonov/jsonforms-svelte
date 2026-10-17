import type Ajv from 'ajv';
import type { ErrorObject, ValidateFunction } from 'ajv';
import type { JsonSchema } from '@jsonforms/core';
import isEqual from 'lodash/isEqual';
import { literalPropertySchema } from './literalPropertySchema';
import { ruleValidationAjv } from './ruleValidation';

const validators = new WeakMap<Ajv, WeakMap<JsonSchema, WeakMap<JsonSchema, ValidateFunction>>>();
export function branchValidator(ajv: Ajv, schema: JsonSchema, root: JsonSchema): ValidateFunction {
  let roots = validators.get(ajv);
  if (!roots) validators.set(ajv, (roots = new WeakMap()));
  let schemas = roots.get(root);
  if (!schemas) roots.set(root, (schemas = new WeakMap()));
  let validate = schemas.get(schema);
  if (!validate) {
    validate = ruleValidationAjv(ajv).compile(literalPropertySchema(schema, root));
    schemas.set(schema, validate);
  }
  return validate;
}

/** Schema locations can differ for independently compiled but equivalent constraints. */
export function mergeBranchErrors(
  documentErrors: ErrorObject[],
  branchErrors: ErrorObject[],
): ErrorObject[] {
  const buckets = new Map<string, ErrorObject[]>();
  return [...documentErrors, ...branchErrors].filter((error) => {
    const key = JSON.stringify([error.instancePath, error.keyword, error.message]);
    const bucket = buckets.get(key) ?? [];
    if (bucket.some((previous) => isEqual(previous.params, error.params))) return false;
    bucket.push(error);
    buckets.set(key, bucket);
    return true;
  });
}
