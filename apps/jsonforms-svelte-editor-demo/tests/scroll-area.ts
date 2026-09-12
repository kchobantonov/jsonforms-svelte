import assert from "node:assert/strict";
import { chromium } from "playwright";
const browser = await chromium.launch();
try {
  for (const integration of ["native", "webcomponent"]) {
    const page = await browser.newPage({
      viewport: { width: 1400, height: 800 },
    });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(process.env.EDITOR_DEMO_URL ?? "http://127.0.0.1:4178");
    await page.locator("#integration").selectOption(integration);
    const palette = page.getByRole("complementary", {
      name: "Components",
      exact: true,
    });
    await palette.waitFor();
    const area = page.locator(".pane-scroll").filter({ has: palette });
    assert.equal(
      await page.locator('.pane-scroll[data-slot="scroll-area"]').count(),
      3,
    );
    assert.equal(
      await area.evaluate((el) => getComputedStyle(el).overflowY),
      "hidden",
    );
    const viewport = area.locator('[data-slot="scroll-area-viewport"]');
    assert.ok(
      await viewport.evaluate((el) => el.scrollHeight > el.clientHeight),
    );
    assert.equal(
      await viewport.evaluate((el) => getComputedStyle(el).scrollbarWidth),
      "none",
      "the viewport must hide native scrollbars",
    );
    await viewport.hover();
    await page.mouse.wheel(0, 400);
    await page.waitForFunction(
      (el) => el && el.scrollTop > 0,
      await viewport.elementHandle(),
    );
    await area.locator('[data-slot="scroll-area-thumb"]').first().waitFor();
    await palette.getByRole("button", { name: "Spacer", exact: true }).click();
    await page.locator(".node-select").filter({ hasText: "Spacer" }).waitFor();
    assert.deepEqual(errors, []);
    console.log(
      `Passed ${integration}: shared ScrollArea panes, themed scrollbar, wheel scrolling and palette selection.`,
    );
    await page.close();
  }
} finally {
  await browser.close();
}
