/** Import this package in a browser to register its custom element. No runtime exports. */
export interface JsonFormsSkeletonElement extends HTMLElement {
  data?: unknown;
  schema?: unknown;
  uischema?: unknown;
  uischemas?: unknown;
  config?: unknown;
  readonly?: boolean | string;
  validationMode?: 'ValidateAndShow' | 'ValidateAndHide' | 'NoValidation';
  locale?: string;
  mode?: boolean | string;
  theme?: string;
  translations?: unknown;
  additionalErrors?: unknown;
  customStyle?: string;
}

declare global {
  interface HTMLElementTagNameMap {
    'jsonforms-svelte-skeleton': JsonFormsSkeletonElement;
  }
}
