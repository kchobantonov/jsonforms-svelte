import assert from "node:assert/strict";
import { chromium } from "playwright";
import { selectSource } from "./source-selection.ts";
const browser = await chromium.launch();
try {
  for (const integration of ["webcomponent", "native"]) {
    const page = await browser.newPage({
      viewport: { width: 1900, height: 1200 },
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(process.env.EDITOR_DEMO_URL ?? "http://127.0.0.1:4178");
    await page.locator("#integration").selectOption(integration);
    await page.getByRole("radio", { name: "Validate", exact: true }).click();
    assert.equal(
      await page.getByLabel("Form language", { exact: true }).count(),
      0,
      "no selector for an untranslated blank form",
    );
    await page.locator("#example").selectOption("main");
    const design = page.getByRole("radio", { name: "Design", exact: true });
    const validate = page.getByRole("radio", { name: "Validate", exact: true });
    await design.click();
    assert.equal(
      await design.getAttribute("aria-checked"),
      "true",
      "active preset cannot be deselected",
    );
    await validate.click();
    assert.equal(await validate.getAttribute("aria-checked"), "true");
    assert.equal(await design.getAttribute("aria-checked"), "false");
    const json = page.getByRole("button", { name: "JSON Model", exact: true });
    await json.click();
    assert.equal(await json.getAttribute("aria-pressed"), "true");
    await json.click();
    assert.equal(await json.getAttribute("aria-pressed"), "false");
    await page
      .getByRole("region", { name: "Form Preview", exact: true })
      .waitFor();
    await design.click();
    await page
      .getByRole("button", {
        name: "Select #/properties/firstName",
        exact: true,
      })
      .click();
    const inspector = page.getByRole("complementary", { name: "Properties" });
    for (const locale of ["fr"]) {
      await page
        .getByRole("button", { name: "Add form language", exact: true })
        .click();
      const dialog = page.getByRole("dialog");
      await dialog.getByLabel("Language code", { exact: true }).fill(locale);
      await dialog
        .getByRole("button", { name: "Add language", exact: true })
        .click();
      await dialog.waitFor({ state: "hidden" });
    }

    await inspector
      .getByRole("button", { name: "Translations", exact: true })
      .click();
    await inspector
      .getByRole("textbox", { name: "Translation key", exact: true })
      .fill("custom.firstName");
    await inspector
      .getByRole("textbox", { name: "Translated label/text · en", exact: true })
      .fill("Given name");
    await page
      .locator(".runtime-sample")
      .getByText("Given name", { exact: true })
      .waitFor();
    await inspector
      .getByRole("textbox", { name: "Translated label/text · bg", exact: true })
      .fill("Име");
    await inspector
      .getByRole("textbox", { name: "Translated label/text · fr", exact: true })
      .fill("Prénom");
    assert.equal(
      await inspector
        .getByRole("textbox", {
          name: "Translated label/text · en",
          exact: true,
        })
        .inputValue(),
      "Given name",
    );
    await validate.click();
    await page.getByLabel("Form language", { exact: true }).click();
    await page.getByRole("option", { name: "fr", exact: true }).waitFor();
    await page.getByRole("option", { name: "bg", exact: true }).click();
    await page
      .locator(".runtime-sample")
      .getByText("Име", { exact: true })
      .waitFor();
    await json.click();
    const source = page.locator(".model-source");
    await source.locator(".monaco-editor").waitFor();
    await selectSource(page, "translations");
    let lines = await source.locator(".view-lines").innerText();
    const deadline = Date.now() + 5000;
    while (!lines.includes("custom") && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 20));
      lines = await source.locator(".view-lines").innerText();
    }
    assert.ok(
      lines.includes("custom"),
      "translation prefix is present in model JSON",
    );
    const apply = source.getByRole("button", { name: "Apply", exact: true });
    const editorBox = (await source.locator(".monaco-editor").boundingBox())!;
    assert.ok(
      (await apply.boundingBox())!.y < editorBox.y,
      "source actions are above Monaco",
    );
    await source
      .locator(".monaco-editor")
      .click({ position: { x: 100, y: 30 } });
    await page.keyboard.press("Control+A");
    await page.keyboard.type("{");
    await apply.hover();
    await page
      .locator('[data-slot="tooltip-content"]')
      .filter({ hasText: "Apply" })
      .waitFor();
    await page.locator("#editor-locale").selectOption("bg");
    await page.getByRole("button", { name: "Отмяна", exact: true }).click();
    await page.getByRole("button", { name: "JSON модел", exact: true }).click();
    await page
      .getByRole("heading", { name: "Дефиниция на формуляра", exact: true })
      .waitFor();
    assert.deepEqual(errors, []);
    await page.close();
    console.log(
      `Passed ${integration}: exclusive toggles, JSON return, source icon tooltips, UI locale and authored translations.`,
    );
  }
} finally {
  await browser.close();
}
