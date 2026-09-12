import assert from "node:assert/strict";
import { chromium } from "playwright";
const browser = await chromium.launch();
try {
  for (const integration of ["native", "webcomponent"]) {
    const page = await browser.newPage({
      permissions: ["clipboard-read", "clipboard-write"],
      viewport: { width: 1800, height: 1100 },
    });
    await page.goto(process.env.EDITOR_DEMO_URL ?? "http://127.0.0.1:4178");
    await page.locator("#integration").selectOption(integration);
    await page
      .getByRole("button", { name: "Add property (root)", exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Name", { exact: true }).fill("union");
    await dialog.getByLabel("Additional types", { exact: true }).click();
    await page.getByRole("option", { name: "number", exact: true }).click();
    await page.keyboard.press("Escape");
    await dialog.getByRole("button", { name: "Save", exact: true }).click();
    await page
      .locator('[data-schema-pointer="#/properties/union"] > .schema-tree-row')
      .getByText("string | number", { exact: true })
      .waitFor();
    const properties = page.getByRole("complementary", {
      name: "Properties",
      exact: true,
    });
    assert.equal(
      await properties
        .getByRole("button", { name: "Add form language", exact: true })
        .count(),
      0,
    );
    for (const name of ["Move up", "Move down", "Remove element"])
      assert.equal(
        await properties.getByRole("button", { name, exact: true }).count(),
        0,
      );
    await page.getByRole("button", { name: "JSON Model", exact: true }).click();
    const source = page.getByRole("region", { name: "Model source" });
    await source.locator(".monaco-editor").waitFor();
    await source
      .locator(".monaco-editor")
      .click({ position: { x: 100, y: 30 } });
    await page.keyboard.press("Control+A");
    await page.evaluate(async () =>
      navigator.clipboard.writeText(
        JSON.stringify(
          {
            schema: {
              type: "object",
              properties: { text: { type: "string" } },
            },
          },
          null,
          2,
        ),
      ),
    );
    await page.keyboard.press("Control+V");
    await source.getByRole("button", { name: "Apply", exact: true }).click();
    await page.getByRole("radio", { name: "Validate", exact: true }).click();
    await page
      .getByRole("region", { name: "Form Preview", exact: true })
      .getByRole("textbox")
      .waitFor();
    assert.equal(
      await page.locator(".runtime-sample").count(),
      0,
      "No generated controls in Form Definition",
    );
    await page
      .locator('[data-schema-pointer="#/properties/text"] > .schema-tree-row')
      .getByRole("button", { name: "text", exact: true })
      .click();
    await properties
      .getByRole("button", { name: "Schema", exact: true })
      .click();
    await properties
      .getByRole("button", { name: "Types", exact: true })
      .click();
    await page.getByRole("option", { name: "number", exact: true }).click();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "JSON Model", exact: true }).click();
    await source
      .locator(".monaco-editor")
      .click({ position: { x: 100, y: 30 } });
    await page.keyboard.press("Control+A");
    await page.keyboard.press("Control+C");
    const model = JSON.parse(
      await page.evaluate(() => navigator.clipboard.readText()),
    );
    assert.equal(model.uischema, undefined);
    assert.deepEqual(model.schema.properties.text.type, ["string", "number"]);
    await page.getByRole("radio", { name: "Design", exact: true }).click();
    const types = properties.getByRole("button", {
      name: "Types",
      exact: true,
    });
    if (!(await types.isVisible()))
      await properties
        .getByRole("button", { name: "Schema", exact: true })
        .click();
    await types.click();
    await page.getByRole("option", { name: "string", exact: true }).click();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "JSON Model", exact: true }).click();
    await source
      .locator(".monaco-editor")
      .click({ position: { x: 100, y: 30 } });
    await page.keyboard.press("Control+A");
    await page.keyboard.press("Control+C");
    const single = JSON.parse(
      await page.evaluate(() => navigator.clipboard.readText()),
    );
    assert.equal(
      single.schema.properties.text.type,
      "number",
      "One selected type serializes as a string",
    );
    await page.close();
    console.log(
      `Passed ${integration}: schema-only preview, focused Properties and visual union types.`,
    );
  }
} finally {
  await browser.close();
}
