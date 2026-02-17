import type { JsonSchema } from '@jsonforms/core';
import { Resolve } from '@jsonforms/core';

export type JsonDataType =
  | 'array'
  | 'boolean'
  | 'integer'
  | 'null'
  | 'number'
  | 'object'
  | 'string';

export function getJsonDataType(value: any): JsonDataType | null {
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  if (typeof value === 'object') return 'object';
  return null;
}

export function resolveSchema(schema: JsonSchema, rootSchema: JsonSchema): JsonSchema {
  if (typeof schema?.$ref === 'string') {
    return Resolve.schema(rootSchema, schema?.$ref, rootSchema) ?? schema;
  }
  return schema;
}

export function cleanSchema(schema: JsonSchema): JsonSchema {
  // Define valid keywords for each JSON Schema type
  const validKeywords: Record<string, string[]> = {
    array: ['items', 'minItems', 'maxItems', 'uniqueItems', 'contains'],
    object: [
      'properties',
      'required',
      'additionalProperties',
      'minProperties',
      'maxProperties',
      'patternProperties',
      'dependencies',
      'propertyNames',
    ],
    string: ['minLength', 'maxLength', 'pattern', 'format'],
    number: ['minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum', 'multipleOf'],
    integer: ['minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum', 'multipleOf'],
    boolean: [],
    null: [],
  };

  const schemaType = schema.type as string;

  // Remove invalid keywords based on type
  for (const validType in validKeywords) {
    if (validType !== schemaType) {
      const keywords = validKeywords[validType];
      keywords.forEach((key) => {
        delete (schema as any)[key];
      });
    }
  }

  return schema;
}

export function getSchemaTypesAsArray(schema: JsonSchema): string[] {
  if (typeof schema.type === 'string') {
    return [schema.type];
  }

  if (Array.isArray(schema.type)) {
    return schema.type;
  }

  if (Array.isArray(schema.enum)) {
    const enumTypes = new Set(schema.enum.map((value) => getJsonDataType(value)));
    if (!enumTypes.has(null)) {
      // return only if we were able to determine all types, otherwise return the default
      return Array.from(enumTypes).filter((type) => type !== null) as string[];
    }
  }

  // return any
  return ['array', 'boolean', 'integer', 'null', 'number', 'object', 'string'];
}

export function hasStructuralChange(
  oldData: any,
  newData: any,
  checkPrimitives: boolean = false,
): boolean {
  // Type change is structural
  const oldType = getJsonDataType(oldData);
  const newType = getJsonDataType(newData);
  if (oldType !== newType) return true;

  // For objects: check if keys changed
  if (oldType === 'object' && newType === 'object') {
    const oldKeys = Object.keys(oldData || {}).sort();
    const newKeys = Object.keys(newData || {}).sort();
    if (JSON.stringify(oldKeys) !== JSON.stringify(newKeys)) return true;

    // Recursively check nested objects/arrays
    for (const key of oldKeys) {
      if (newKeys.includes(key)) {
        const oldVal = oldData[key];
        const newVal = newData[key];
        const oldValType = getJsonDataType(oldVal);
        const newValType = getJsonDataType(newVal);

        if (oldValType !== newValType) return true;

        // Only recurse for complex types (or primitives if we're showing them in tree)
        if (oldValType === 'object' || oldValType === 'array') {
          if (hasStructuralChange(oldVal, newVal, checkPrimitives)) {
            return true;
          }
        } else if (checkPrimitives && oldVal !== newVal) {
          // If showing primitives, their value changes are "structural" for tree purposes
          return true;
        }
      }
    }
  }

  // For arrays: check if length changed or item types changed
  if (oldType === 'array' && newType === 'array') {
    if (oldData.length !== newData.length) return true;

    // Check if any item changed
    for (let i = 0; i < oldData.length; i++) {
      const oldItem = oldData[i];
      const newItem = newData[i];
      const oldItemType = getJsonDataType(oldItem);
      const newItemType = getJsonDataType(newItem);

      if (oldItemType !== newItemType) return true;

      if (oldItemType === 'object' || oldItemType === 'array') {
        if (hasStructuralChange(oldItem, newItem, checkPrimitives)) {
          return true;
        }
      } else if (checkPrimitives && oldItem !== newItem) {
        return true;
      }
    }
  }

  return false;
}
