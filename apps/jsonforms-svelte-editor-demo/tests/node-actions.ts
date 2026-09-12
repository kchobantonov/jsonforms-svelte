import assert from "node:assert/strict";
import { chromium } from "playwright";
const browser = await chromium.launch();
try {
  for (const integration of ["webcomponent", "native"]) {
    const page = await browser.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(process.env.EDITOR_DEMO_URL ?? "http://127.0.0.1:4178");
    await page.locator("#integration").selectOption(integration);
    for (const name of ["checkbox", "number", "textarea", "number", "number"]) {
      await page
        .getByRole("complementary", { name: "Components", exact: true })
        .getByRole("button", { name, exact: true })
        .click();
      assert.equal(
        await page.locator(".design-node.selected").count(),
        1,
        "adding fields must highlight only the selected layout",
      );
    }
    const numberNode = page
      .locator(".design-node")
      .filter({
        has: page.getByRole("button", {
          name: "Select #/properties/number",
          exact: true,
        }),
      })
      .last();
    // The frame is part of the selection target, not only its nested buttons.
    await numberNode.click({ position: { x: 3, y: 3 } });
    assert.equal(await page.locator(".design-node.selected").count(), 1);
    const properties = page.getByRole("complementary", {
      name: "Properties",
      exact: true,
    });
    await properties
      .getByRole("heading", { name: "Control properties", exact: true })
      .waitFor();
    await properties
      .getByRole("textbox", { name: "Label", exact: true })
      .waitFor();
    await page
      .locator(".node-select")
      .filter({ hasText: "VerticalLayout" })
      .first()
      .click();
    await properties
      .getByRole("heading", { name: "VerticalLayout properties", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Select #/properties/number", exact: true })
      .click();
    await properties
      .getByRole("heading", { name: "Control properties", exact: true })
      .waitFor();
    assert.equal(await page.locator(".design-node.selected").count(), 1);
    await page.getByRole("button", { name: "New form", exact: true }).click();
    await page
      .getByRole("button", { name: "Discard changes", exact: true })
      .click();
    await page.locator("#example").selectOption("main");
    const select = page.getByRole("button", {
      name: "Select #/properties/firstName",
      exact: true,
    });
    const remove = page.locator('[aria-label="Remove #/properties/firstName"]');
    await select.waitFor();
    assert.equal(await remove.isVisible(), false);
    await select.hover();
    assert.equal(
      await remove.isVisible(),
      false,
      "hover alone does not reveal delete",
    );
    await select.focus();
    assert.equal(
      await remove.isVisible(),
      false,
      "focus alone does not reveal delete",
    );
    await select.click();
    assert.equal(await remove.isVisible(), true);
    await remove.click();
    assert.equal(await select.count(), 0);
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    await select.waitFor();
    const layout = page
      .locator(".node-select")
      .filter({ hasText: "HorizontalLayout" })
      .first();
    await layout.click();
    await page
      .getByRole("button", { name: "Remove HorizontalLayout", exact: true })
      .click();
    assert.equal(await select.count(), 0);
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    await select.waitFor();
    assert.deepEqual(errors, []);
    await page.close();
    console.log(
      `Passed ${integration}: selected-only delete and host undo of controls/layouts.`,
    );
  }
} finally {
  await browser.close();
}
