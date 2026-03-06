import {
  createControlElement,
  findUISchema,
  type ControlElement,
  type JsonFormsUISchemaRegistryEntry,
  type JsonSchema,
  type JsonSchema7,
  type UISchemaElement,
} from '@jsonforms/core';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import set from 'lodash/set';
import {
  cleanSchema,
  getJsonDataType,
  getSchemaTypesAsArray,
  resolveSchema,
} from './jsonTypeUtils';

export interface SchemaRenderInfo {
  schema: JsonSchema;
  resolvedSchema: JsonSchema;
  uischema: UISchemaElement;
  label: string;
}

export function createMixedRenderInfos(
  parentSchema: JsonSchema,
  schema: JsonSchema,
  rootSchema: JsonSchema,
  control: ControlElement,
  path: string,
  uischemas: JsonFormsUISchemaRegistryEntry[],
): SchemaRenderInfo[] {
  let resolvedSchemas: JsonSchema[] = [];
  schema = resolveSchema(schema, rootSchema);

  if (typeof schema.type === 'string') {
    resolvedSchemas.push(schema);
  } else {
    const types = getSchemaTypesAsArray(schema);

    types.forEach((type) => {
      resolvedSchemas.push({
        ...schema,
        type,
        default:
          schema.default !== undefined && type === getJsonDataType(schema.default)
            ? schema.default
            : undefined,
      });
    });
  }

  return resolvedSchemas.map((resolvedSchema) => {
    if (resolvedSchema.type === 'array') {
      resolvedSchema.items = resolvedSchema.items ?? {};
      resolvedSchema.items = resolveSchema(resolvedSchema.items as JsonSchema, rootSchema);

      if ((resolvedSchema.items as any) === true) {
        resolvedSchema.items = {
          type: ['array', 'boolean', 'integer', 'null', 'number', 'object', 'string'],
        };
      } else if (
        typeof (resolvedSchema.items as JsonSchema7).type !== 'string' &&
        !Array.isArray((resolvedSchema.items as JsonSchema7).type)
      ) {
        (resolvedSchema.items as JsonSchema7).type = [
          'array',
          'boolean',
          'integer',
          'null',
          'number',
          'object',
          'string',
        ];
      }
    }

    // help determining the correct renders by removing keywords not appropriate for the type
    let cleanedSchema = cleanSchema(resolvedSchema);

    const detailsForSchema = control.options
      ? control.options[cleanedSchema.type + '-detail']
      : undefined;

    const schemaControl = detailsForSchema
      ? {
          ...control,
          options: { ...control.options, detail: detailsForSchema },
        }
      : control;

    if (control.scope && (cleanedSchema.type === 'object' || cleanedSchema.type === 'array')) {
      const segments = control.scope.split('/');
      const startFromRoot = segments[0] === '#' || segments[0] === '';
      const startIndex = startFromRoot ? 1 : 0;

      if (segments.length > startIndex) {
        // for object schema the object renderer expects to get the parent schema
        const schemaPath = segments.slice(startIndex).join('.');
        if (schemaPath && isEqual(get(parentSchema, schemaPath), schema)) {
          // double check that the schema that we are going to replace is the schema that is with the mixed type
          const newSchema = cloneDeep(parentSchema);
          set(newSchema, schemaPath, cleanedSchema);
          cleanedSchema = newSchema;
        }
      }
    }

    const uischema = findUISchema(
      uischemas,
      cleanedSchema,
      control.scope,
      path,
      () => createControlElement(control.scope ?? '#'),
      schemaControl,
      rootSchema,
    );

    return {
      schema: cleanedSchema,
      resolvedSchema: resolvedSchema,
      uischema,
      label: `${resolvedSchema.type}`,
    };
  });
}

export function findPropertySchema(
  parentSchema: JsonSchema,
  propName: string,
  rootSchema: JsonSchema,
): JsonSchema | undefined {
  // First, try direct properties
  if (parentSchema.properties && parentSchema.properties[propName]) {
    let propSchema = parentSchema.properties[propName];
    return resolveSchema(propSchema, rootSchema);
  }

  // Then, try patternProperties
  if (parentSchema.patternProperties) {
    const matchedPattern = Object.keys(parentSchema.patternProperties).find((pattern) =>
      new RegExp(pattern).test(propName),
    );

    if (matchedPattern) {
      let propSchema = parentSchema.patternProperties[matchedPattern];
      return resolveSchema(propSchema, rootSchema);
    }
  }

  // Finally, try additionalProperties
  if (typeof parentSchema.additionalProperties === 'object') {
    let propSchema = parentSchema.additionalProperties;
    return resolveSchema(propSchema, rootSchema);
  } else if (parentSchema.additionalProperties === true) {
    return { additionalProperties: true };
  }

  return undefined;
}

export function getArrayItemSchema(
  parentSchema: JsonSchema,
  index: number,
  rootSchema: JsonSchema,
): JsonSchema | undefined {
  if (!parentSchema.items) {
    return undefined;
  }

  let itemSchema: JsonSchema | undefined;

  // Handle tuple validation (array of schemas)
  if (Array.isArray(parentSchema.items)) {
    if (index < parentSchema.items.length) {
      itemSchema = parentSchema.items[index];
    } else if (parentSchema.additionalItems) {
      // Use additionalItems schema for items beyond the tuple definition
      itemSchema =
        typeof parentSchema.additionalItems === 'object' ? parentSchema.additionalItems : undefined;
    }
  } else {
    // Single schema for all items
    itemSchema = parentSchema.items as JsonSchema;
  }

  return itemSchema ? resolveSchema(itemSchema, rootSchema) : undefined;
}
