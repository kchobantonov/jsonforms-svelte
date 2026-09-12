import assert from "node:assert/strict";
import { chromium } from "playwright";
import type {} from "./browser-types.ts";
const browser = await chromium.launch();
try {
  for (const integration of ["native", "webcomponent"]) {
    const page = await browser.newPage({
      viewport: { width: 1900, height: 1300 },
    });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(process.env.EDITOR_DEMO_URL ?? "http://127.0.0.1:4178");
    await page.locator("#integration").selectOption(integration);
    await page.evaluate(() => {
      window.changes = [];
      document
        .querySelector("#editor-host")!
        .addEventListener("document-change", (event) =>
          window.changes.push((event as CustomEvent).detail),
        );
    });
    for (const name of [
      "Separator",
      "Spacer",
      "Image View",
      "Select",
      "Radio group",
      "Checkbox group",
    ])
      await page.getByRole("button", { name, exact: true }).click();
    assert.equal(
      await page.locator('.runtime-sample [data-slot="separator"]').count(),
      1,
    );
    await page
      .locator(".node-select")
      .filter({ hasText: /^Spacer$/ })
      .click();
    const inspector = page.getByRole("complementary", { name: "Properties" });
    await inspector
      .getByRole("spinbutton", { name: "Height (px)", exact: true })
      .fill("64");
    assert.equal(
      await page.locator('.runtime-sample [style*="height: 64px"]').count(),
      1,
    );
    await page
      .locator(".node-select")
      .filter({ hasText: /^ImageView$/ })
      .click();
    await inspector
      .getByRole("textbox", { name: "Image URL", exact: true })
      .fill(
        "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      );
    await inspector
      .getByRole("textbox", { name: "Alternative text", exact: true })
      .fill("Example image");
    await page
      .locator(".runtime-sample")
      .getByRole("img", { name: "Example image" })
      .waitFor();
    await page
      .getByRole("button", { name: "Select #/properties/text", exact: true })
      .click();
    await inspector
      .getByRole("button", { name: "Choices", exact: true })
      .click();
    await inspector
      .getByRole("button", { name: "Choice schema", exact: true })
      .click();
    await page.getByRole("option", { name: "oneOf", exact: true }).click();
    await page.waitForFunction(() =>
      Array.isArray(
        window.changes.at(-1)?.document.schema.properties.text.oneOf,
      ),
    );
    const doc = await page.evaluate(() => window.changes.at(-1)!.document);
    assert.deepEqual(doc.schema.properties.text.oneOf, [
      { const: "Option 1", title: "Option 1" },
      { const: "Option 2", title: "Option 2" },
    ]);
    assert.equal(doc.schema.properties.text.enum, undefined);
    await inspector
      .getByRole("button", { name: "Choices", exact: true })
      .click();
    await inspector
      .getByRole("columnheader", { name: "Title", exact: true })
      .waitFor();
    await inspector
      .locator("tbody tr")
      .first()
      .getByRole("textbox")
      .nth(1)
      .fill("First option");
    await page.waitForFunction(() => {
      const values = window.changes.at(-1)?.document.schema.properties.text
        .oneOf as { title?: string }[] | undefined;
      return values?.[0]?.title === "First option";
    });
    assert.equal(doc.schema.properties.text3.type, "array");
    assert.equal(doc.schema.properties.text3.uniqueItems, true);
    assert.equal(doc.uischema.elements[4].options?.format, "radio");
    assert.equal(
      Object.keys(doc.schema.properties).length,
      3,
      "presentation elements create no data fields",
    );
    await page.getByRole("radio", { name: "Validate", exact: true }).click();
    const preview = page.getByRole("region", {
      name: "Form Preview",
      exact: true,
    });
    await preview.getByRole("img", { name: "Example image" }).waitFor();
    await preview.getByRole("button", { name: "Text", exact: true }).click();
    await page
      .getByRole("option", { name: "First option", exact: true })
      .waitFor();
    await page.keyboard.press("Escape");
    assert.ok((await preview.getByRole("radio").count()) >= 2);
    assert.ok((await preview.getByRole("checkbox").count()) >= 2);
    assert.deepEqual(errors, []);
    await page.close();
    console.log(
      `Passed ${integration}: presentation palette/options, enum-to-oneOf and actual selection renderers.`,
    );
  }
} finally {
  await browser.close();
}
