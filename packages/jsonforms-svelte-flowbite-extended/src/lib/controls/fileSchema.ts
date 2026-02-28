import type { JsonSchema } from '@jsonforms/core';

export type JsonSchemaWithContent = JsonSchema & {
  contentEncoding?: string;
  contentMediaType?: string;
  formatMinimum?: number | string;
  formatMaximum?: number | string;
  formatExclusiveMinimum?: number | string;
  formatExclusiveMaximum?: number | string;
};
