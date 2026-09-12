import meta from "./schema-meta.json";
import type { Document } from "../document/commands/index.js";
const node = {
  type: "object",
  properties: {
    type: {
      enum: [
        "Control",
        "VerticalLayout",
        "HorizontalLayout",
        "Group",
        "Categorization",
        "Category",
        "Label",
        "Separator",
        "Spacer",
        "ImageView",
        "Template",
        "Slot",
        "TemplateLayout",
        "Button",
      ],
    },
    scope: { type: "string" },
    label: { type: ["string", "boolean"] },
    elements: { type: "array", items: { $ref: "#/definitions/node" } },
    options: {
      type: "object",
      properties: { multi: { type: "boolean" }, variant: { type: "string" }, height: { type: "number", minimum: 0, default: 32 }, src: { type: "string" }, alt: { type: "string" }, format: { type: "string" } },
    },
    rule: { type: "object" },
  },
  required: ["type"],
};
export function sourceSchema(
  part: string,
  document: Document,
): Record<string, unknown> {
  if (part === "schema") return meta;
  if (part === "data")
    return typeof document.schema === "object" ? (document.schema ?? {}) : {};
  if (part === "uischema") return { ...node, definitions: { node } };
  if (part === "uischemas")
    return {
      type: "array",
      items: {
        type: "object",
        properties: {
          tester: { type: "string" },
          uischema: { $ref: "#/definitions/node" },
        },
      },
      definitions: { node },
    };
  if (part === "model")
    return {
      type: "object",
      properties: {
        schema: meta,
        uischema: { $ref: "#/definitions/node" },
        uischemas: { type: "array" },
        config: { type: "object" },
      },
      definitions: { node },
    };
  return { type: "object" };
}
