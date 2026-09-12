import assert from "node:assert/strict";
import { chromium } from "playwright";
const browser = await chromium.launch();
try {
  for (const integration of ["webcomponent", "native"]) {
    const page = await browser.newPage({
      viewport: { width: 1800, height: 1100 },
    });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(process.env.EDITOR_DEMO_URL ?? "http://127.0.0.1:4178");
    await page.locator("#integration").selectOption(integration);
    await page.locator("#example").selectOption("main");
    const inspector = page.getByRole("complementary", { name: "Properties" });
    await inspector.waitFor();
    assert.equal(
      await inspector
        .getByRole("textbox", { name: "Label", exact: true })
        .count(),
      0,
      "VerticalLayout has no label editor",
    );
    await page.evaluate(() => {
      window.changes = [];
      document
        .querySelector("#editor-host")!
        .addEventListener("document-change", (event) =>
          window.changes.push(
            (event as CustomEvent<(typeof window.changes)[number]>).detail,
          ),
        );
    });
    await page
      .getByRole("button", {
        name: "Select #/properties/committer",
        exact: true,
      })
      .click();
    await inspector
      .getByRole("button", { name: "Appearance", exact: true })
      .click();
    assert.equal(
      await inspector
        .getByRole("checkbox", {
          name: "Multiline",
          exact: true,
          includeHidden: true,
        })
        .count(),
      0,
    );
    await page
      .getByRole("button", {
        name: "Select #/properties/firstName",
        exact: true,
      })
      .click();
    await inspector
      .getByRole("button", { name: "Appearance", exact: true })
      .click();
    await inspector
      .getByRole("checkbox", { name: "Multiline", exact: true })
      .click();
    await page.waitForFunction(() =>
      JSON.stringify(window.changes.at(-1)?.document.uischema).includes(
        '"multi":true',
      ),
    );
    await inspector
      .getByRole("button", { name: "Validation", exact: true })
      .click();
    await inspector
      .getByRole("checkbox", { name: "Required", exact: true })
      .click();
    await page.waitForFunction(() => {
      const required = window.changes.at(-1)?.document.schema.required;
      return Array.isArray(required) && required.includes("firstName");
    });
    await inspector
      .getByRole("spinbutton", { name: "Minimum length", exact: true })
      .fill("2");
    await page.waitForFunction(
      () =>
        window.changes.at(-1)?.document.schema.properties.firstName
          .minLength === 2,
    );
    const beforePattern = await page.evaluate(() => window.changes.length);
    await inspector.getByRole("textbox", { name: "Pattern", exact: true }).fill("[");
    await page.waitForTimeout(200);
    assert.equal(await page.evaluate(() => window.changes.length), beforePattern, "invalid regex does not corrupt the schema");
    await inspector.getByRole("textbox", { name: "Pattern", exact: true }).fill("^A");
    await page.waitForFunction(() => window.changes.at(-1)?.document.schema.properties.firstName.pattern === "^A");
    await page.getByRole("button", { name: "Group", exact: true }).click();
    await page
      .locator(".node-select")
      .filter({ hasText: /^Group$/ })
      .last()
      .click();
    await inspector
      .getByRole("button", { name: "Layout", exact: true })
      .click();
    await inspector
      .getByRole("checkbox", { name: "Collapsible", exact: true })
      .click();
    await inspector
      .getByRole("checkbox", { name: "Show data indicator", exact: true })
      .click();
    await page.waitForFunction(() =>
      JSON.stringify(window.changes.at(-1)?.document.uischema).includes(
        '"showDataIndicator":true',
      ),
    );
    const general = inspector.getByRole("button", {
      name: "General",
      exact: true,
    });
    const generalCard = inspector
      .locator('[data-slot="card"]')
      .filter({
        has: page.getByRole("button", { name: "General", exact: true }),
      });
    assert.equal(
      await generalCard.getByRole("img", { name: "Contains data" }).count(),
      1,
    );
    await general.click();
    assert.equal(await general.getAttribute("aria-expanded"), "false");
    assert.equal(
      await generalCard.getByRole("img", { name: "Contains data" }).isVisible(),
      true,
    );
    assert.deepEqual(errors, []);
    await page.close();
    console.log(
      `Passed ${integration}: inspector sections, type-specific fields, schema edits, Group options and persistent indicator.`,
    );
  }
} finally {
  await browser.close();
}
