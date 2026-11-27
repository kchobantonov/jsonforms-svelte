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
}

export interface JsonFormsHostProperties {
  data?: unknown;
}

export interface JsonFormsValidityEvent {
  /** Automatic schema validation is current; false in NoValidation. */
  readonly current: boolean;
  readonly errors: readonly JsonFormsValidationError[];
  readonly additionalErrors: readonly JsonFormsValidationError[];
  readonly pending: boolean;
  readonly valid: boolean;
}

/** Native DOM events and the typed validity-change event. */
export interface JsonFormsEventTarget extends HTMLElement {
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
}

export interface JsonFormsHostProperties {
  data?: unknown;
  schema?: unknown;
  uischema?: unknown;
  uischemas?: unknown;
  config?: unknown;
  /** Immutable host input; also accepts a JSON attribute. Does not activate overlays. */
  external?: Readonly<Record<string, unknown>> | string;
  readonly?: boolean | string;
  validationMode?: 'ValidateAndShow' | 'ValidateAndHide' | 'NoValidation';
  locale?: string;
  mode?: boolean | string;
  translations?: unknown;
  additionalErrors?: unknown;
  externalSchemas?: unknown;
  /** Host-supplied Ajv instance; assign as a JavaScript property. */
  ajv?: object;
  customStyle?: string;
}
