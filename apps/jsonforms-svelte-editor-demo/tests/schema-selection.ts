import assert from "node:assert/strict";
import { chromium } from "playwright";
import type {} from "./browser-types.ts";
const browser = await chromium.launch();
try {
  for (const integration of ["webcomponent", "native"]) {
    const page = await browser.newPage({
      viewport: { width: 1800, height: 1100 },
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(process.env.EDITOR_DEMO_URL ?? "http://127.0.0.1:4178");
    await page.locator("#integration").selectOption(integration);
    await page.getByRole("button", { name: "JSON Model", exact: true }).click();
    const source = page.locator(".model-source");
    await source
      .locator(".monaco-editor")
      .click({ position: { x: 120, y: 30 } });
    await page.keyboard.press("Control+A");
    const model = {
      schema: {
        type: "object",
        properties: { name: { type: "string" }, unused: { type: "boolean" } },
      },
      uischema: {
        type: "Categorization",
        elements: [
          {
            type: "Category",
            label: "First tab",
            elements: [
              {
                type: "Control",
                label: "Short name",
                scope: "#/properties/name",
              },
            ],
          },
          {
            type: "Category",
            label: "Second tab",
            elements: [
              {
                type: "Control",
                label: "Long name",
                scope: "#/properties/name",
                options: { multi: true },
              },
            ],
          },
        ],
      },
    };
    await page.evaluate(
      (text) => navigator.clipboard.writeText(text),
      JSON.stringify(model),
    );
    await page.keyboard.press("Control+V");
    await source.getByRole("button", { name: "Apply", exact: true }).click();
    await page.getByRole("button", { name: "JSON Model", exact: true }).click();
    await page.evaluate(() => {
      window.changes = [];
      document
        .querySelector("#editor-host")!
        .addEventListener("document-change", (event) =>
          window.changes.push((event as CustomEvent).detail),
        );
    });
    const tree = page.getByRole("tree", { name: "Schema", exact: true });
    const inspector = page.getByRole("complementary", { name: "Properties" });
    await tree.getByRole("button", { name: "unused", exact: true }).click();
    await inspector
      .getByText(
        "This field is not placed in the form. Drag it to a layout to create a control. Edit its schema in JSON Model.",
      )
      .waitFor();
    await tree.getByRole("button", { name: "name", exact: true }).click();
    assert.equal(
      await inspector
        .getByRole("textbox", { name: "Label", exact: true })
        .inputValue(),
      "Short name",
    );
    await page.getByLabel("Control placement", { exact: true }).click();
    await page.getByRole("option").filter({ hasText: "Long name" }).click();
    assert.equal(
      await inspector
        .getByRole("textbox", { name: "Label", exact: true })
        .inputValue(),
      "Long name",
    );
    assert.equal(
      await page
        .locator(".category-tab")
        .filter({ hasText: "Second tab" })
        .getAttribute("aria-pressed"),
      "true",
    );
    await tree.getByRole("button", { name: "name", exact: true }).click();
    assert.equal(
      await inspector
        .getByRole("textbox", { name: "Label", exact: true })
        .inputValue(),
      "Long name",
      "retain current matching occurrence",
    );
    assert.equal(
      await page.evaluate(() => window.changes.length),
      0,
      "selection never mutates model",
    );
    await inspector
      .getByRole("button", { name: "Appearance", exact: true })
      .click();
    await inspector
      .getByRole("checkbox", { name: "Multiline", exact: true })
      .uncheck();
    const current = await page.evaluate(
      () => window.changes.at(-1)!.document.uischema,
    );
    assert.equal(current.elements[0].elements![0].options?.multi, undefined);
    assert.equal(current.elements[1].elements![0].options?.multi, false);
    const filter = page.getByRole("checkbox", {
      name: "Show unused fields only",
      exact: true,
    });
    await filter.check();
    assert.equal(
      await tree.getByRole("button", { name: "name", exact: true }).count(),
      0,
    );
    await tree.getByRole("button", { name: "unused", exact: true }).waitFor();
    await filter.uncheck();
    await tree.getByRole("button", { name: "name", exact: true }).click();
    await inspector
      .getByRole("button", { name: "Remove element", exact: true })
      .click();
    await tree.getByRole("button", { name: "name", exact: true }).click();
    await inspector
      .getByRole("button", { name: "Remove element", exact: true })
      .click();
    await filter.check();
    await tree.getByRole("button", { name: "name", exact: true }).waitFor();
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    assert.equal(
      await tree.getByRole("button", { name: "name", exact: true }).count(),
      0,
      "undo updates usage",
    );
    assert.deepEqual(errors, []);
    await page.close();
    console.log(
      `Passed ${integration}: unused filter, non-mutating selection, duplicate chooser, tab reveal and per-placement options.`,
    );
  }
} finally {
  await browser.close();
}
