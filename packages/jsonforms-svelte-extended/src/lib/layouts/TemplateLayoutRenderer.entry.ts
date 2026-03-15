import {
  and,
  rankWith,
  uiTypeIs,
  type JsonFormsRendererRegistryEntry,
  type JsonSchema,
  type Tester,
  type TesterContext,
  type UISchemaElement,
} from "@jsonforms/core";
import templateLayoutRenderer from "./TemplateLayoutRenderer.svelte";

export const langIs =
  (expected: string): Tester =>
  (
    uischema: UISchemaElement & { lang?: string },
    _schema: JsonSchema,
    context: TesterContext,
  ): boolean => {
    return (
      uischema.lang === expected ||
      (uischema.lang === undefined &&
        (!context.config ||
          context.config.defaultTemplateLang === expected ||
          context.config.defaultTemplateLang === undefined))
    );
  };

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: templateLayoutRenderer,
  tester: rankWith(2, and(uiTypeIs("TemplateLayout"), langIs("ractive"))),
};
