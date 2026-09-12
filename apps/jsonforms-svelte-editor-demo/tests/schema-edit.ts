import assert from "node:assert/strict";
import { chromium } from "playwright";
const browser = await chromium.launch();
try {
  for (const integration of process.env.EDITOR_INTEGRATION
    ? [process.env.EDITOR_INTEGRATION]
    : ["native", "webcomponent"]) {
    const page = await browser.newPage();
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(process.env.EDITOR_DEMO_URL ?? "http://127.0.0.1:4178");
    await page.locator("#integration").selectOption(integration);
    const row = (pointer: string) =>
      page.locator(`[data-schema-pointer="${pointer}"] > .schema-tree-row`);
    const dialog = page.getByRole("dialog");
    async function save(name: string, type?: string) {
      await dialog
        .getByRole("textbox", { name: "Name", exact: true })
        .fill(name);
      if (type) {
        await dialog
          .getByLabel("Schema type or definition", { exact: true })
          .click();
        await page.getByRole("option", { name: type, exact: true }).click();
      }
      await dialog.getByRole("button", { name: "Save", exact: true }).click();
      await dialog.waitFor({ state: "hidden" });
    }
    for (const mode of ["dark", "light"]) {
      await page.locator("#mode").selectOption(mode);
      await row("#")
        .getByRole("button", { name: "Add property (root)", exact: true })
        .click();
      await dialog.waitFor();
      const colors = await dialog.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          insideEditor: Boolean(element.closest(".editor")),
          background: style.backgroundColor,
          foreground: style.color,
        };
      });
      assert.ok(
        colors.insideEditor,
        "Dialog must inherit the editor theme inside its portal target",
      );
      assert.notEqual(
        colors.background,
        "rgba(0, 0, 0, 0)",
        "Dialog surface must be opaque",
      );
      assert.notEqual(
        colors.foreground,
        colors.background,
        "Dialog text must contrast with its surface",
      );
      await dialog
        .getByRole("textbox", { name: "Name", exact: true })
        .fill("visible");
      await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    }
    await row("#")
      .getByRole("button", { name: "Add definition", exact: true })
      .click();
    await save("Address");
    await row("#/definitions/Address")
      .getByRole("button", {
        name: "Add property definitions: Address",
        exact: true,
      })
      .click();
    await save("street");
    await row("#")
      .getByRole("button", { name: "Add property (root)", exact: true })
      .click();
    await save("address", "#/definitions/Address");
    await row("#/definitions/Address")
      .getByRole("button", { name: "Rename definitions: Address", exact: true })
      .click();
    await save("Location");
    await row("#/definitions/Location")
      .getByRole("button", {
        name: "Delete definitions: Location",
        exact: true,
      })
      .click();
    await dialog.getByRole("button", { name: "Delete", exact: true }).click();
    await dialog
      .getByRole("alert")
      .filter({ hasText: "still referenced" })
      .waitFor();
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await row("#/properties/address")
      .getByRole("button", { name: "Delete address", exact: true })
      .click();
    await dialog.getByRole("button", { name: "Delete", exact: true }).click();
    await row("#/properties/address").waitFor({ state: "hidden" });
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    await row("#/properties/address").waitFor();
    await row("#")
      .getByRole("button", { name: "Add property (root)", exact: true })
      .click();
    await save("people", "array");
    await row("#/properties/people")
      .getByRole("button", { name: "Expand people", exact: true })
      .click();
    await row("#/properties/people/items")
      .getByRole("button", { name: "Add property items", exact: true })
      .click();
    await save("name");
    await row("#/properties/people/items")
      .getByRole("button", { name: "Expand items", exact: true })
      .click();
    await row("#/properties/people/items/properties/name").waitFor();
    assert.deepEqual(errors, []);
    console.log(
      `Passed ${integration}: schema creation, definitions, references, rename, protected deletion and undo.`,
    );
    await page.close();
  }
} finally {
  await browser.close();
}
