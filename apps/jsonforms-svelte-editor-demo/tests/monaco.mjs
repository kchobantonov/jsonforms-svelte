import assert from "node:assert/strict";
import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
let page;
try {
  page = await browser.newPage({
    permissions: ["clipboard-read", "clipboard-write"],
    viewport: { width: 1500, height: 1100 },
  });
  await page.context().tracing.start({ screenshots: true, snapshots: true });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.stack || error.message));
  await page.goto(process.env.EDITOR_DEMO_URL ?? "http://127.0.0.1:4178");
  await page.getByRole("button", { name: "Model", exact: true }).click();
  await page.locator(".monaco-editor textarea").waitFor();
  await page
    .getByLabel("Source document", { exact: true })
    .selectOption("schema");
  async function paste(text) {
    await page.locator(".monaco-editor").click({ position: { x: 140, y: 30 } });
    await page.keyboard.press("Escape");
    await page.keyboard.press("Control+a");
    await page.evaluate((value) => navigator.clipboard.writeText(value), text);
    await page.keyboard.press("Control+v");
  }
  await paste("{}");
  await page.keyboard.press("Control+Home");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.type('"prop');
  await page.keyboard.press("Control+Space");
  await page
    .locator(".suggest-widget.visible .monaco-list-row")
    .filter({ hasText: "properties" })
    .first()
    .waitFor({ timeout: 20000 });
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Revert", exact: true }).click();
  await paste('{"type":123}');
  await page
    .locator(".monaco-editor .squiggly-error, .monaco-editor .squiggly-warning")
    .first()
    .waitFor({ timeout: 20000 });
  await page.getByRole("button", { name: "Revert", exact: true }).click();
  await page
    .getByLabel("Source document", { exact: true })
    .selectOption("data");
  await paste("{}");
  await page.keyboard.press("Control+Home");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.type('"first');
  await page.keyboard.press("Control+Space");
  await page
    .locator(".suggest-widget.visible .monaco-list-row")
    .filter({ hasText: "firstName" })
    .first()
    .waitFor({ timeout: 20000 });
  assert.deepEqual(errors, []);
  console.log(
    "Passed: JSON Schema keyword completion, meta-schema diagnostics, and authored-schema data completion.",
  );
} catch (error) {
  await page
    ?.screenshot({ path: "/tmp/editor-monaco-failure.png", fullPage: true })
    .catch(() => {});
  await page
    ?.context()
    .tracing.stop({ path: "/tmp/editor-monaco-trace.zip" })
    .catch(() => {});
  throw error;
} finally {
  await browser.close();
}
