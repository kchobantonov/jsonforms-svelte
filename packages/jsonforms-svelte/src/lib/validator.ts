import { createAjv } from '@jsonforms/core';
import type { AnySchema, Options, ValidateFunction } from 'ajv';

/** The default renderer validator, with a temporary root registration for
 * anonymous recursive schemas. Supplied host validators are used unchanged. */
export function createRendererAjv(options?: Options) {
  const ajv = createAjv(options);
  const compile = ajv.compile.bind(ajv);
  const removeSchema = ajv.removeSchema.bind(ajv);
  let anonymous = new WeakMap<object, ValidateFunction>();
  ajv.removeSchema = ((schema) => {
    if (schema && typeof schema === 'object' && !(schema instanceof RegExp))
      anonymous.delete(schema);
    else anonymous = new WeakMap();
    return removeSchema(schema);
  }) as typeof ajv.removeSchema;
  ajv.compile = ((schema: AnySchema) => {
    if (
      !schema ||
      typeof schema !== 'object' ||
      schema.$id ||
      ajv.opts.addUsedSchema !== false ||
      ajv.getSchema('')
    )
      return compile(schema);
    const cached = anonymous.get(schema);
    if (cached) return cached;
    // Ajv 8.20 needs this registration to resolve an anonymous "$ref": "#"
    // with addUsedSchema:false. Use the original object and release only our
    // temporary slot; compiled functions retain their recursive references.
    ajv.addSchema(schema, '');
    try {
      const validate = compile(schema);
      anonymous.set(schema, validate);
      return validate;
    } finally {
      removeSchema('');
    }
  }) as typeof ajv.compile;
  return ajv;
}
