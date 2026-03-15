import {
  rankWith,
  uiTypeIs,
  type JsonFormsRendererRegistryEntry,
  type JsonFormsUISchemaRegistryEntry,
  type JsonSchema,
  type UISchemaElement,
} from "@jsonforms/core";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { page } from "vitest/browser";
import JsonForms from "../../src/lib/components/JsonForms.svelte";
import {
  slotRendererEntry,
  templateRendererEntry,
} from "../../src/lib/layouts";
import RecursiveLayoutRenderer from "../fixtures/RecursiveLayoutRenderer.svelte";
import TextRenderer from "../fixtures/TextRenderer.svelte";

const verticalLayoutRendererEntry: JsonFormsRendererRegistryEntry = {
  tester: rankWith(1, uiTypeIs("VerticalLayout")),
  renderer: RecursiveLayoutRenderer,
};

const labelRendererEntry: JsonFormsRendererRegistryEntry = {
  tester: rankWith(1, uiTypeIs("Label")),
  renderer: TextRenderer,
};

const schema: JsonSchema = {
  type: "object",
  properties: {
    value: { type: "string" },
  },
};

const createRegistryEntry = (
  uischema: UISchemaElement,
): JsonFormsUISchemaRegistryEntry => ({
  tester: () => -1,
  uischema,
});

describe("Template and Slot renderers", () => {
  it("resolves named templates and applies slot overrides from parent templates", async () => {
    render(JsonForms, {
      props: {
        data: { value: "Initial value" },
        schema,
        uischema: {
          type: "Template",
          name: "page",
          elements: [
            {
              type: "Label",
              name: "footer",
              text: "Overridden Footer",
            },
          ],
        } as unknown as UISchemaElement,
        uischemas: [
          createRegistryEntry({
            type: "VerticalLayout",
            name: "page",
            elements: [
              {
                type: "Slot",
                name: "header",
                elements: [
                  {
                    type: "Label",
                    text: "Default Header",
                  },
                ],
              },
              {
                type: "Slot",
                name: "content",
                elements: [
                  {
                    type: "Template",
                    name: "content",
                  },
                ],
              },
              {
                type: "Slot",
                name: "footer",
                elements: [
                  {
                    type: "Label",
                    text: "Default Footer",
                  },
                ],
              },
            ],
          } as unknown as UISchemaElement),
          createRegistryEntry({
            type: "VerticalLayout",
            name: "content",
            elements: [
              {
                type: "Label",
                text: "Nested Content",
              },
            ],
          } as unknown as UISchemaElement),
        ],
        renderers: [
          templateRendererEntry,
          slotRendererEntry,
          verticalLayoutRendererEntry,
          labelRendererEntry,
        ],
      },
    });

    await expect.element(page.getByText("Default Header")).toBeInTheDocument();
    await expect.element(page.getByText("Nested Content")).toBeInTheDocument();
    await expect
      .element(page.getByText("Overridden Footer"))
      .toBeInTheDocument();
    await expect
      .element(page.getByText("Default Footer"))
      .not.toBeInTheDocument();
  });

  it("falls back to the first slot element when no named content is provided", async () => {
    render(JsonForms, {
      props: {
        data: {},
        schema,
        uischema: {
          type: "Slot",
          name: "missing",
          elements: [
            {
              type: "Label",
              text: "Fallback Slot Content",
            },
          ],
        } as unknown as UISchemaElement,
        renderers: [slotRendererEntry, labelRendererEntry],
      },
    });

    await expect
      .element(page.getByText("Fallback Slot Content"))
      .toBeInTheDocument();
  });
});
