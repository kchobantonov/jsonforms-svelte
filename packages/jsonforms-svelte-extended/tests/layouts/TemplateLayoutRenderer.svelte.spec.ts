import type {
  JsonFormsRendererRegistryEntry,
  JsonSchema,
  UISchemaElement,
} from "@jsonforms/core";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import { page } from "vitest/browser";
import JsonForms from "../../src/lib/components/JsonForms.svelte";
import { templateLayoutRendererEntry } from "../../src/lib/layouts";
import CaptureRenderer from "../fixtures/CaptureRenderer.svelte";

const captureRendererEntry: JsonFormsRendererRegistryEntry = {
  tester: () => 1,
  renderer: CaptureRenderer,
};

const schema: JsonSchema = {
  type: "object",
  properties: {
    value: { type: "string" },
  },
};

const createUiSchema = (): UISchemaElement =>
  ({
    type: "TemplateLayout",
    template:
      '<section><h1>{{translate("title", "Template Title")}}</h1><div class="value">{{data.value}}</div>{{>field}}</section>',
    elements: [
      {
        type: "Control",
        scope: "#/properties/value",
        name: "field",
      },
    ],
  }) as unknown as UISchemaElement;

describe("TemplateLayoutRenderer", () => {
  it("renders template content and mounts named child renderers into placeholders", async () => {
    render(JsonForms, {
      props: {
        data: { value: "Initial value" },
        schema,
        uischema: createUiSchema(),
        renderers: [templateLayoutRendererEntry, captureRendererEntry],
      },
    });

    await expect.element(page.getByText("Template Title")).toBeInTheDocument();
    await expect.element(page.getByText("Initial value")).toBeInTheDocument();
    await expect
      .element(page.getByTestId("uischema-json"))
      .toHaveTextContent("#/properties/value");
  });

  it("updates the rendered template when form data changes", async () => {
    const view = render(JsonForms, {
      props: {
        data: { value: "Before" },
        schema,
        uischema: createUiSchema(),
        renderers: [templateLayoutRendererEntry, captureRendererEntry],
      },
    });

    await expect.element(page.getByText("Before")).toBeInTheDocument();

    await view.rerender({
      data: { value: "After" },
      schema,
      uischema: createUiSchema(),
      renderers: [templateLayoutRendererEntry, captureRendererEntry],
    });

    await expect.element(page.getByText("After")).toBeInTheDocument();
  });

  it("shows a template error when the Ractive template is invalid", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(JsonForms, {
      props: {
        data: { value: "Broken" },
        schema,
        uischema: {
          type: "TemplateLayout",
          template: "{{#if data.value}}",
          elements: [],
        } as unknown as UISchemaElement,
        renderers: [templateLayoutRendererEntry, captureRendererEntry],
      },
    });

    await expect.element(page.getByRole("alert")).toBeInTheDocument();
    await expect
      .element(page.getByRole("alert"))
      .toHaveTextContent("Template Error");

    consoleError.mockRestore();
  });
});
