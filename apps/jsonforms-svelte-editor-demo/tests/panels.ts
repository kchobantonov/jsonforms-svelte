import assert from "node:assert/strict";
import { chromium } from "playwright";
const browser = await chromium.launch();
try {
  for (const integration of ["webcomponent", "native"]) {
    const page = await browser.newPage({
      viewport: { width: 1800, height: 1100 },
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(process.env.EDITOR_DEMO_URL ?? "http://127.0.0.1:4178");
    await page.locator("#integration").selectOption(integration);
    await page.locator("#example").selectOption("main");
    await page
      .getByRole("heading", { name: "Form Definition", exact: true })
      .waitFor();
    const editor = page.getByRole("region", {
      name: "Form editor",
      exact: true,
    });
    assert.equal(
      await editor.getByRole("button", { name: "Undo", exact: true }).count(),
      0,
      "history belongs to host",
    );
    assert.equal(
      await page
        .getByRole("region", { name: "Form Preview", exact: true })
        .isVisible(),
      false,
    );
    assert.equal(
      await page.locator('.runtime-sample input[aria-invalid="true"]').count(),
      0,
      "design samples hide validation errors",
    );
    assert.ok(
      (await page
        .locator(".runtime-sample")
        .getByText("*", { exact: true })
        .count()) > 0,
      "required stars remain in design",
    );
    for (const name of [
      "Inputs",
      "Selection",
      "Presentation",
      "Actions",
      "Containers",
    ])
      await page.getByRole("heading", { name, exact: true }).waitFor();
    await page.getByRole("button", { name: "Label", exact: true }).click();
    await page.getByRole("button", { name: "Button", exact: true }).click();
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    await page.getByRole("button", { name: "Redo", exact: true }).click();
    await page.getByRole("radio", { name: "Validate", exact: true }).click();
    await page
      .getByRole("button", { name: "Apply input", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Hide Form Output", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Hide Form Output", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Show Form Output", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Hide Form Output", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Hide Form Input", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Show Form Input", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Apply input", exact: true })
      .waitFor();
    const inputPane = page.locator(".workspace-panel").filter({
      has: page
        .locator(":scope > .panel-heading")
        .getByRole("heading", { name: "Form Input", exact: true }),
    });
    const outputPane = page.locator(".workspace-panel").filter({
      has: page
        .locator(":scope > .panel-heading")
        .getByRole("heading", { name: "Form Output", exact: true }),
    });
    await inputPane
      .locator(".panel-heading")
      .getByRole("button", { name: "Apply input", exact: true })
      .waitFor();
    await inputPane
      .locator(".panel-heading")
      .getByRole("button", { name: "Revert input", exact: true })
      .waitFor();
    await inputPane.locator(".monaco-editor").waitFor();
    await outputPane.locator(".monaco-editor").waitFor();
    await page.waitForTimeout(300);
    const inputBounds = (await inputPane
      .locator(".monaco-editor")
      .boundingBox())!;
    const outputBounds = (await outputPane
      .locator(".monaco-editor")
      .boundingBox())!;
    assert.ok(
      Math.abs(inputBounds.y - outputBounds.y) <= 1,
      `Input and Output editors align after collapse and expand: ${JSON.stringify({ inputBounds, outputBounds })}`,
    );
    const preview = page.getByRole("region", {
      name: "Form Preview",
      exact: true,
    });
    await preview.waitFor();
    await page
      .getByRole("button", { name: "Hide Form Preview", exact: true })
      .click();
    assert.equal(
      await inputPane.isVisible(),
      false,
      "Input belongs to the collapsed preview",
    );
    assert.equal(await outputPane.isVisible(), false);
    assert.equal(
      await page
        .getByRole("button", { name: "Show Form Input", exact: true })
        .isVisible(),
      false,
    );
    await page
      .getByRole("button", { name: "Show form preview", exact: true })
      .click();
    await inputPane.waitFor();
    await outputPane.waitFor();

    assert.ok(
      (await preview.boundingBox())!.x >
        (await page.locator(".designer-pane").boundingBox())!.x,
    );
    await page.getByRole("button", { name: "JSON Model", exact: true }).click();
    assert.equal(
      await page
        .getByRole("heading", { name: "Components", exact: true })
        .isVisible(),
      false,
    );
    assert.equal(await page.locator(".designer-pane").isVisible(), false);
    assert.equal(await preview.isVisible(), false);
    const source = page.getByRole("region", { name: "Model source" });
    await source.locator(".monaco-editor").waitFor();
    assert.ok(
      (await source.boundingBox())!.width > 1500,
      "JSON occupies whole editor width",
    );
    await source
      .locator(".monaco-editor")
      .click({ position: { x: 100, y: 30 } });
    await page.keyboard.press("Control+A");
    await page.keyboard.type("{");
    await page.getByRole("radio", { name: "Design", exact: true }).click();
    assert.equal(
      await page
        .getByRole("button", { name: "text", exact: true })
        .isDisabled(),
      true,
    );
    await page.getByRole("button", { name: "JSON Model", exact: true }).click();
    await source.getByRole("button", { name: "Revert", exact: true }).click();
    await page.getByRole("radio", { name: "Design", exact: true }).click();
    assert.equal(
      await page
        .getByRole("button", { name: "text", exact: true })
        .isDisabled(),
      false,
    );
    assert.deepEqual(errors, []);
    await page.screenshot({ path: `/tmp/editor-views-${integration}.png` });
    await page.close();
    console.log(
      `Passed ${integration}: grouped components, host history, Design/Validate/JSON Model and draft lock.`,
    );
  }
} finally {
  await browser.close();
}
