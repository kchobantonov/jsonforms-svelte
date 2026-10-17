/** Structured validation entry; standalone consumers do not need Svelte or AJV types. */
export interface JsonFormsValidationError {
  keyword: string;
  instancePath: string;
  schemaPath: string;
  params: Record<string, unknown>;
  message?: string;
  propertyName?: string;
  schema?: unknown;
  parentSchema?: unknown;
  data?: unknown;
}

export interface JsonFormsValidityEvent {
  readonly errors: readonly JsonFormsValidationError[];
  readonly additionalErrors: readonly JsonFormsValidationError[];
  readonly pending: boolean;
  readonly valid: boolean;
}

/** Import this package in a browser to register its custom element. No runtime exports. */
export interface JsonFormsShadcnElement extends HTMLElement {
  addEventListener(
    type: 'validity-change',
    listener: (event: CustomEvent<JsonFormsValidityEvent>) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener<K extends keyof HTMLElementEventMap>(
    type: K,
    listener: (this: HTMLElement, event: HTMLElementEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions,
  ): void;
  removeEventListener(
    type: 'validity-change',
    listener: (event: CustomEvent<JsonFormsValidityEvent>) => void,
    options?: boolean | EventListenerOptions,
  ): void;
  removeEventListener<K extends keyof HTMLElementEventMap>(
    type: K,
    listener: (this: HTMLElement, event: HTMLElementEventMap[K]) => void,
    options?: boolean | EventListenerOptions,
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | EventListenerOptions,
  ): void;
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
  designSystem?: unknown;
  translations?: unknown;
  additionalErrors?: unknown;
  customStyle?: string;
}

declare global {
  interface HTMLElementTagNameMap {
    'jsonforms-svelte-shadcn': JsonFormsShadcnElement;
  }
}
