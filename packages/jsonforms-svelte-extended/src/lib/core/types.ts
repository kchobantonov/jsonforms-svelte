import type {
  BaseUISchemaElement,
  Internationalizable,
  JsonFormsI18nState,
  JsonSchema,
  Layout,
  Translator,
  UISchemaElement,
} from "@jsonforms/core";
import type { ErrorObject } from "ajv";

export const buttonSemanticColors = [
  "primary",
  "secondary",
  "alternative",
  "success",
  "warning",
  "error",
] as const;

export type ButtonSemanticColor = (typeof buttonSemanticColors)[number];

export const toButtonSemanticColor = (
  value: unknown,
): ButtonSemanticColor | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();

  return buttonSemanticColors.find((color) => color === normalized);
};

export interface ButtonElement
  extends BaseUISchemaElement, Internationalizable {
  type: "Button";
  label?: string;
  // Literal icon content, e.g. a glyph such as "✓" or a short text marker.
  icon?: string;
  color?: ButtonSemanticColor;
  params?: Record<string, unknown>;
  action?: string;
  script?: string;
}

export interface TemplateLayout extends Layout {
  type: "TemplateLayout";
  template: string;
  lang?: string;
  elements: UISchemaElement[];
}

export type NamedUISchemaElement = UISchemaElement & {
  name: string;
};

export interface FormContext {
  [key: string]: unknown;

  config?: unknown;
  readonly?: boolean;
  locale?: string;
  translate?: Translator;
  data?: unknown;
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  errors?: ErrorObject[];
  additionalErrors?: ErrorObject[];
  fireActionEvent?: <TypeEl extends Element = Element>(
    action: string,
    params: Record<string, unknown> | undefined,
    el: TypeEl,
  ) => Promise<void>;
}

export type ActionEvent = {
  action: string;
  callback?: (event: ActionEvent) => void | Promise<void>;
  context: FormContext;
  params: Record<string, unknown>;
  $el: Element;
};

export type I18nGetter =
  | JsonFormsI18nState
  | undefined
  | (() => JsonFormsI18nState | undefined);

export const AsyncFunction = Object.getPrototypeOf(async function (
  _event: ActionEvent,
) {}).constructor;

export const FormContextSymbol = Symbol.for("jsonforms-form-context");
