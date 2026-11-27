import type {
  JsonFormsChangeEvent,
  JsonFormsProps,
  JsonFormsValidityEvent,
} from '@chobantonov/jsonforms-svelte-renderer-common';
import type { ActionEvent } from '@chobantonov/jsonforms-svelte-extended';
import type { ErrorObject } from 'ajv';
export interface DemoWebComponentProps {
  ajv?: JsonFormsProps['ajv'];
  data?: unknown;
  schema?: unknown;
  uischema?: unknown;
  uischemas?: unknown;
  config?: unknown;
  external?: JsonFormsProps['external'];
  readonly?: boolean | string;
  validationMode?: JsonFormsProps['validationMode'];
  locale?: string;
  mode?: boolean | string;
  theme?: string;
  designSystem?: unknown;
  translations?: unknown;
  additionalErrors?: ErrorObject[];
  externalSchemas?: unknown;
  customStyle?: string;
  onchange?: (event: JsonFormsChangeEvent) => void;
  onvaliditychange?: (event: JsonFormsValidityEvent) => void;
  onhandleaction?: (event: ActionEvent) => void | Promise<void>;
}

export function loadDemoWebComponent(bundlePath: string) {
  return import(/* @vite-ignore */ bundlePath);
}

export type DemoHostAttributes = Pick<
  DemoWebComponentProps,
  | 'uischema'
  | 'uischemas'
  | 'external'
  | 'readonly'
  | 'validationMode'
  | 'locale'
  | 'mode'
  | 'theme'
  | 'customStyle'
> & {
  schema?: string;
  data?: string;
  config?: string;
  designSystem?: string;
  translations?: string;
  additionalErrors?: string;
  externalSchemas?: string;
};
