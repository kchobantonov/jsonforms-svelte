export const schemaFields = {
  schemaTitle: "title",
  schemaDescription: "description",
  minLength: "minLength",
  maxLength: "maxLength",
  pattern: "pattern",
  format: "format",
  minimum: "minimum",
  maximum: "maximum",
  multipleOf: "multipleOf",
  minItems: "minItems",
  maxItems: "maxItems",
  uniqueItems: "uniqueItems",
  minProperties: "minProperties",
  maxProperties: "maxProperties",
} as const;
export const optionFields = [
  "readonly",
  "collapsible",
  "collapsed",
  "showDataIndicator",
] as const;
