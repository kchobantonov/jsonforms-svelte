import assert from "node:assert/strict";
import { chromium } from "playwright";
const browser = await chromium.launch();
try {
  for (const integration of process.env.EDITOR_INTEGRATION
    ? [process.env.EDITOR_INTEGRATION]
    : ["native", "webcomponent"]) {
    const page = await browser.newPage({
      viewport: { width: 1800, height: 1100 },
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(process.env.EDITOR_DEMO_URL ?? "http://127.0.0.1:4178");
    await page.locator("#integration").selectOption(integration);
    await page.getByRole("button", { name: "text", exact: true }).click();
    await page
      .getByRole("button", { name: "Select #/properties/text", exact: true })
      .click();
    const props = page.getByRole("complementary", {
      name: "Properties",
      exact: true,
    });
    await props.getByRole("button", { name: "Add rule", exact: true }).click();
    await props.getByRole("textbox", { name: "Value", exact: true }).fill("BG");
    await props
      .getByRole("button", { name: "Apply rule", exact: true })
      .click();
    await page
      .locator(".design-node")
      .getByRole("button", { name: "Edit rule", exact: true })
      .waitFor();
    await page.getByRole("radio", { name: "Validate", exact: true }).click();
    const preview = page.getByRole("region", {
      name: "Form Preview",
      exact: true,
    });
    assert.equal(await preview.getByRole("textbox").count(), 0);
    await props.getByRole("button", { name: "Edit rule", exact: true }).click();
    await props.getByRole("button", { name: "JSON", exact: true }).click();
    const monaco = props.locator(".monaco-editor");
    await monaco.waitFor();
    await monaco.click({ position: { x: 80, y: 25 } });
    await page.keyboard.press("Control+A");
    await page.evaluate(async () =>
      navigator.clipboard.writeText(
        JSON.stringify(
          {
            effect: "READONLY",
            condition: { scope: "#", schema: {}, failWhenUndefined: true },
          },
          null,
          2,
        ),
      ),
    );
    await page.keyboard.press("Control+V");
    await props
      .getByRole("button", { name: "Apply rule", exact: true })
      .click();
    await preview.getByRole("textbox").waitFor();
    await preview.locator("input[readonly], textarea[readonly]").waitFor();
    assert.equal(await preview.getByRole("textbox").isEditable(), false);
    for (const effect of ["HIDE", "SHOW", "DISABLE", "ENABLE", "WRITABLE"]) {
      await props
        .getByRole("button", { name: "Edit rule", exact: true })
        .click();
      const toggle = props.getByRole("button", { name: "JSON", exact: true });
      if ((await toggle.getAttribute("aria-pressed")) !== "true")
        await toggle.click();
      await monaco.waitFor();
      await monaco.click({ position: { x: 80, y: 25 } });
      await page.keyboard.press("Control+A");
      await page.evaluate(
        async (effect) =>
          navigator.clipboard.writeText(
            JSON.stringify({ effect, condition: { scope: "#", schema: {} } }),
          ),
        effect,
      );
      await page.keyboard.press("Control+V");
      await props
        .getByRole("button", { name: "Apply rule", exact: true })
        .click();
      if (effect === "HIDE")
        await preview.getByRole("textbox").waitFor({ state: "hidden" });
      else {
        await preview.getByRole("textbox").waitFor();
        if (effect === "DISABLE")
          await preview.locator("input:disabled").waitFor();
        else
          await preview
            .locator("input:not(:disabled):not([readonly])")
            .waitFor();
      }
    }
    await props.getByRole("button", { name: "Edit rule", exact: true }).click();
    await monaco.waitFor();
    await monaco.click({ position: { x: 80, y: 25 } });
    await page.keyboard.press("Control+A");
    await page.evaluate(async () => navigator.clipboard.writeText("{"));
    await page.keyboard.press("Control+V");
    await props
      .getByRole("button", { name: "Apply rule", exact: true })
      .click();
    await props.getByRole("alert").waitFor();
    await props
      .getByRole("button", { name: "Revert rule", exact: true })
      .click();
    await props
      .getByRole("button", { name: "Remove rule", exact: true })
      .click();
    await props
      .getByRole("button", { name: "Add rule", exact: true })
      .waitFor();
    assert.equal(
      await page
        .locator(".design-node")
        .getByRole("button", { name: "Edit rule", exact: true })
        .count(),
      0,
    );
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    await page
      .locator(".design-node")
      .getByRole("button", { name: "Edit rule", exact: true })
      .waitFor();
    assert.deepEqual(errors, []);
    await page.close();
    console.log(
      `Passed ${integration}: visual rule, JSON, marker, Preview readonly and remove/undo.`,
    );
  }
} finally {
  await browser.close();
}
