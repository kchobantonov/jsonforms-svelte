import {
  Resolve,
  and,
  isStringControl,
  optionIs,
  or,
  rankWith,
  uiTypeIs,
  type JsonSchema,
  type Tester,
  type TesterContext,
  type UISchemaElement,
} from "@jsonforms/core";
import type { editor } from "monaco-editor";

const hasStringValueOption =
  (name: string): Tester =>
  (
    uischema: UISchemaElement,
    _schema: JsonSchema,
    _context: TesterContext,
  ): boolean =>
    typeof uischema.options?.[name] === "string";

export const monacoControlTester = rankWith(
  3,
  and(
    optionIs("format", "code"),
    or(
      and(
        isStringControl,
        or(hasStringValueOption("language"), hasStringValueOption(":language")),
      ),
      and(
        uiTypeIs("Control"),
        optionIs("language", "json"),
        optionIs("convertJson", true),
      ),
    ),
  ),
);

export interface MonacoRendererOptions {
  rows?: number;
  minRows?: number;
  maxRows?: number;
  autoGrow?: boolean;
  options?: Omit<
    editor.IStandaloneEditorConstructionOptions,
    "language" | "model" | "theme" | "value"
  >;
  initActions?: string[];
}

export const resolveMonacoLanguage = (
  options: Record<string, any> | undefined,
  rootData: unknown,
): string => {
  const path = options?.[":language"];
  if (typeof path === "string") {
    const resolved = Resolve.data(rootData, path);
    if (typeof resolved === "string" && resolved) return resolved;
  }
  return typeof options?.language === "string" && options.language
    ? options.language
    : "plaintext";
};

export const toMonacoEditorValue = (
  value: unknown,
  language: string,
  convertJson: boolean,
): string => {
  if (language === "json" && convertJson) {
    return value == null ? "" : JSON.stringify(value, null, 2);
  }
  return value == null ? "" : typeof value === "string" ? value : String(value);
};

export const fromMonacoEditorValue = (
  value: string,
  language: string,
  convertJson: boolean,
): { valid: boolean; value: unknown } => {
  if (language === "json" && convertJson) {
    try {
      return { valid: true, value: JSON.parse(value) };
    } catch {
      return { valid: false, value };
    }
  }
  return { valid: true, value: value || undefined };
};

export const resolveMonacoOptions = (
  options: Record<string, any> | undefined,
): MonacoRendererOptions => options?.monaco ?? {};
