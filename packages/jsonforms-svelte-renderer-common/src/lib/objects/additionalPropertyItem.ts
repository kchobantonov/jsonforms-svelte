import {
  Generate,
  composePaths,
  createControlElement,
  type GroupLayout,
  type JsonSchema,
  type UISchemaElement,
} from '@jsonforms/core';
import startCase from 'lodash/startCase';
import { additionalPropertySchema } from './additionalPropertySchema';

export interface AdditionalPropertyItem {
  propertyName: string;
  path: string;
  schema: JsonSchema;
  uischema: UISchemaElement | undefined;
}

export const additionalPropertyItem = (
  propName: string,
  parentSchema: JsonSchema,
  rootSchema: JsonSchema,
  parentPath: string,
): AdditionalPropertyItem => {
  let propSchema = additionalPropertySchema(propName, parentSchema, rootSchema);
  let propUiSchema: UISchemaElement | undefined = undefined;

  if (
    propSchema.type === undefined &&
    !propSchema.allOf &&
    !propSchema.anyOf &&
    !propSchema.oneOf
  ) {
    propSchema = {
      ...propSchema,
      type: ['array', 'boolean', 'integer', 'null', 'number', 'object', 'string'],
    };
  }

  if (propSchema.type === 'array') {
    propUiSchema = Generate.uiSchema(propSchema, 'Group', undefined, rootSchema);
    (propUiSchema as GroupLayout).label = propSchema.title ?? startCase(propName);
  } else {
    propUiSchema = createControlElement('#');
  }

  propSchema = {
    ...propSchema,
    title: propName,
  };
  if (propSchema.type === 'object') {
    propSchema.additionalProperties =
      propSchema.additionalProperties !== false ? (propSchema.additionalProperties ?? true) : false;
  } else if (propSchema.type === 'array') {
    propSchema.items = propSchema.items ?? {};
  }

  return {
    propertyName: propName,
    path: composePaths(parentPath, propName),
    schema: propSchema,
    uischema: propUiSchema,
  };
};
