import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import { describe, expect, it } from "vitest";
import {
  extendedSharedLayoutRenderers,
  templateRendererEntry,
} from "../../src/lib/layouts";

const schema: JsonSchema = {
  type: "object",
  properties: {
    value: { type: "string" },
  },
};

describe("TemplateRenderer entry", () => {
  it("matches named template elements", () => {
    expect(
      templateRendererEntry.tester(
        {
          type: "Template",
          name: "profile",
        } as unknown as UISchemaElement,
        schema,
        {
          rootSchema: schema,
          config: {},
        },
      ),
    ).toBe(2);
  });

  it("does not match unnamed template elements", () => {
    expect(
      templateRendererEntry.tester(
        {
          type: "Template",
        } as unknown as UISchemaElement,
        schema,
        {
          rootSchema: schema,
          config: {},
        },
      ),
    ).toBe(-1);
  });

  it("exports the shared template renderer entry", () => {
    expect(extendedSharedLayoutRenderers).toContain(templateRendererEntry);
  });
});
