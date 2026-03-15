import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import { describe, expect, it } from "vitest";
import {
  extendedSharedLayoutRenderers,
  slotRendererEntry,
} from "../../src/lib/layouts";

const schema: JsonSchema = {
  type: "object",
  properties: {
    value: { type: "string" },
  },
};

describe("SlotRenderer entry", () => {
  it("matches slot elements", () => {
    expect(
      slotRendererEntry.tester(
        {
          type: "Slot",
          name: "content",
        } as unknown as UISchemaElement,
        schema,
        {
          rootSchema: schema,
          config: {},
        },
      ),
    ).toBe(2);
  });

  it("exports the shared slot renderer entry", () => {
    expect(extendedSharedLayoutRenderers).toContain(slotRendererEntry);
  });
});
