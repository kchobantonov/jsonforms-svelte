import {
  and,
  rankWith,
  uiTypeIs,
  type JsonFormsRendererRegistryEntry,
  type UISchemaElement,
} from "@jsonforms/core";
import templateRenderer from "./TemplateRenderer.svelte";

export const hasName = (uischema: UISchemaElement): boolean =>
  typeof (uischema as { name?: unknown }).name === "string";

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: templateRenderer,
  tester: rankWith(2, and(uiTypeIs("Template"), hasName)),
};
