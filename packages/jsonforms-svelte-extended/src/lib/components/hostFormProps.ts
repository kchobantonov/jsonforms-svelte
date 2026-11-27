import type { JsonFormsProps, JsonInput } from '@chobantonov/jsonforms-svelte-renderer-common';
import type Ajv from 'ajv';
export interface HostFormProps {
  data?: JsonInput;
  schema?: JsonInput;
  uischema?: JsonInput;
  uischemas?: JsonInput;
  config?: JsonInput;
  external?: JsonInput;
  readonly?: boolean | string;
  validationMode?: JsonFormsProps['validationMode'];
  locale?: string;
  translations?: JsonInput;
  additionalErrors?: JsonInput;
  externalSchemas?: JsonInput;
  ajv?: Ajv;
}
