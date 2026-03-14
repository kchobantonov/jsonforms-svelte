import type {
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
} from "@jsonforms/core";
import { describe, expect, it } from "vitest";
import { mapStateToButtonProps } from "../src/lib/jsonFormsCompositions.svelte.ts";

describe("mapStateToButtonProps", () => {
  it("maps label, actions, and registry references for button controls", () => {
    const renderers = [{}] as JsonFormsRendererRegistryEntry[];
    const cells = [{}] as JsonFormsCellRendererRegistryEntry[];

    const result = mapStateToButtonProps(
      {
        jsonforms: {
          core: {
            data: { status: "Idle" },
            schema: {
              type: "object",
              properties: {
                status: { type: "string" },
              },
            },
            uischema: {
              type: "VerticalLayout",
              elements: [],
            },
            errors: [],
          },
          config: {
            translated: true,
          },
          i18n: {
            locale: "en",
            translate: (_key: string, defaultMessage: string | undefined) =>
              `translated:${defaultMessage}`,
          },
          renderers,
          cells,
          readonly: false,
          uischemas: [],
        },
      } as any,
      {
        schema: {
          type: "object",
          properties: {
            status: { type: "string" },
          },
        },
        uischema: {
          type: "Button",
          label: "Apply action",
          action: "applyStatus",
          script: "return true;",
          params: { status: "Updated" },
          color: "error",
        },
        path: "",
      } as any,
    );

    expect(result.label).toBe("translated:Apply action");
    expect(result.action).toBe("applyStatus");
    expect(result.script).toBe("return true;");
    expect(result.params).toEqual({ status: "Updated" });
    expect(result.color).toBe("error");
    expect(result.enabled).toBe(true);
    expect(result.renderers).toBe(renderers);
    expect(result.cells).toBe(cells);
  });

  it("respects an explicit hidden state from own props", () => {
    const result = mapStateToButtonProps(
      {
        jsonforms: {
          core: {
            data: {},
            schema: {
              type: "object",
              properties: {},
            },
            uischema: {
              type: "VerticalLayout",
              elements: [],
            },
            errors: [],
          },
          config: {},
          i18n: {
            locale: "en",
            translate: (_key: string, defaultMessage: string | undefined) =>
              defaultMessage,
          },
          renderers: [],
          cells: [],
          readonly: false,
          uischemas: [],
        },
      } as any,
      {
        schema: {
          type: "object",
          properties: {},
        },
        uischema: {
          type: "Button",
          label: "Hidden action",
        },
        path: "",
        visible: false,
      } as any,
    );

    expect(result.visible).toBe(false);
  });
});
