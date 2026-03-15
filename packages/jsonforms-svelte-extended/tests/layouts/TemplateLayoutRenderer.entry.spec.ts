import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import { describe, expect, it } from "vitest";
import {
  extendedSharedLayoutRenderers,
  templateLayoutRendererEntry,
} from "../../src/lib/layouts";

const schema: JsonSchema = {
  type: "object",
  properties: {
    value: { type: "string" },
  },
};

const createLayout = (lang?: string): UISchemaElement =>
  ({
    type: "TemplateLayout",
    ...(lang ? { lang } : {}),
    template: "<div>{{>field}}</div>",
    elements: [
      {
        type: "Control",
        scope: "#/properties/value",
        name: "field",
      },
    ],
  }) as unknown as UISchemaElement;

describe("TemplateLayoutRenderer entry", () => {
  it("matches ractive template layouts", () => {
    expect(
      templateLayoutRendererEntry.tester(createLayout("ractive"), schema, {
        rootSchema: schema,
        config: {},
      }),
    ).toBe(2);
  });

  it("uses the configured default template language when lang is omitted", () => {
    expect(
      templateLayoutRendererEntry.tester(createLayout(), schema, {
        rootSchema: schema,
        config: { defaultTemplateLang: "ractive" },
      }),
    ).toBe(2);
    expect(
      templateLayoutRendererEntry.tester(createLayout(), schema, {
        rootSchema: schema,
        config: {},
      }),
    ).toBe(2);
  });

  it("does not match unsupported template languages", () => {
    expect(
      templateLayoutRendererEntry.tester(createLayout("vue"), schema, {
        rootSchema: schema,
        config: {},
      }),
    ).toBe(-1);
    expect(
      templateLayoutRendererEntry.tester(createLayout(), schema, {
        rootSchema: schema,
        config: { defaultTemplateLang: "liquid" },
      }),
    ).toBe(-1);
  });

  it("exports the shared template layout renderer entry", () => {
    expect(extendedSharedLayoutRenderers).toEqual([
      templateLayoutRendererEntry,
    ]);
  });
});
