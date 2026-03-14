import {
  rankWith,
  uiTypeIs,
  type JsonFormsRendererRegistryEntry,
  type UISchemaElement,
} from "@jsonforms/core";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import { page } from "vitest/browser";
import JsonForms from "../src/lib/components/JsonForms.svelte";
import type { ActionEvent } from "../src/lib/types";
import ButtonRenderer from "./fixtures/ButtonRenderer.svelte";

const buttonRenderers: JsonFormsRendererRegistryEntry[] = [
  {
    tester: rankWith(1, uiTypeIs("Button")),
    renderer: ButtonRenderer,
  },
];

describe("Extended JsonForms.svelte", () => {
  it("fires handle-action and lets the callback update form data", async () => {
    const onchange = vi.fn();
    const appStore = { jsonforms: { locale: { value: "en" } } };
    const onhandleaction = vi.fn((event: ActionEvent) => {
      event.callback = (source: ActionEvent) => {
        source.context.data = {
          ...(source.context.data ?? {}),
          status: source.params.status,
        };
      };
    });

    render(JsonForms, {
      props: {
        data: { status: "Idle" },
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
          params: { status: "Updated from action" },
        } satisfies Record<string, unknown> as UISchemaElement,
        renderers: buttonRenderers,
        onchange,
        context: { appStore },
        onhandleaction,
      },
    });

    const button = page.getByRole("button", { name: "Apply action" });
    await expect.element(button).toBeInTheDocument();
    await button.click();

    await vi.waitFor(() => {
      expect(onhandleaction).toHaveBeenCalled();
    });

    expect(onhandleaction.mock.lastCall?.[0].action).toBe("applyStatus");
    expect(onhandleaction.mock.lastCall?.[0].params).toEqual({
      status: "Updated from action",
    });
    expect(onhandleaction.mock.lastCall?.[0].context.appStore).toBe(appStore);

    await vi.waitFor(() => {
      expect(onchange.mock.lastCall?.[0].data).toEqual({
        status: "Updated from action",
      });
    });
  });

  it("keeps internal data in sync with incoming prop changes", async () => {
    const onchange = vi.fn();

    const view = render(JsonForms, {
      props: {
        data: { status: "Idle" },
        schema: {
          type: "object",
          properties: {
            status: { type: "string" },
          },
        },
        renderers: [],
        onchange,
      },
    });

    await vi.waitFor(() => {
      expect(onchange).toHaveBeenCalled();
    });

    await view.rerender({
      data: { status: "Updated externally" },
      schema: {
        type: "object",
        properties: {
          status: { type: "string" },
        },
      },
      renderers: [],
      onchange,
    });

    await vi.waitFor(() => {
      expect(onchange.mock.lastCall?.[0].data).toEqual({
        status: "Updated externally",
      });
    });
  });
});
