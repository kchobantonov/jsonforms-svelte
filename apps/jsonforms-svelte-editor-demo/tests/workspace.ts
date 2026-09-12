import assert from "node:assert/strict";
import { chromium, type Locator } from "playwright";
const browser = await chromium.launch({ headless: true });
try {
  for (const integration of ["webcomponent", "native"]) {
    const page = await browser.newPage({
      viewport: { width: 1600, height: 1100 },
    });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (m) => {
      if (m.type() === "error") console.log(m.text());
    });
    await page.goto(process.env.EDITOR_DEMO_URL ?? "http://127.0.0.1:4178");
    await page
      .getByRole("heading", { name: "Form Definition", exact: true })
      .waitFor();
    await page.locator("#integration").selectOption(integration);
    await page.locator("#example").selectOption("main");
    await page
      .getByRole("heading", { name: "Form Definition", exact: true })
      .waitFor();
    await page.evaluate(() => {
      window.changes = [];
      document
        .querySelector("#editor-host")!
        .addEventListener("document-change", (e) =>
          window.changes.push(
            (e as CustomEvent<(typeof window.changes)[number]>).detail,
          ),
        );
    });
    const inspector = page.getByRole("complementary", { name: "Properties" });
    const before = (await inspector.boundingBox())!;
    const handle = page.getByRole("separator", {
      name: "Resize canvas and inspector",
    });
    await handle.focus();
    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(100);
    const after = (await inspector.boundingBox())!;
    assert.ok(after.width > before.width, "keyboard splitter grows inspector");
    const separator = page.getByRole("separator", {
      name: "Resize schema tree and canvas",
    });
    const box = (await separator.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 70, box.y + box.height / 2, { steps: 10 });
    await page.mouse.up();
    const shifted = (await separator.boundingBox())!;
    assert.ok(shifted.x > box.x + 20, "pointer splitter moves");
    // Palette insertion goes through real svelte-dnd-action pointer events.
    const source = page.getByRole("button", {
      name: "Drag textarea",
      exact: true,
    });
    const target = page.locator("[data-drop-target]").first();
    async function drag(source: Locator, target: Locator) {
      await source.scrollIntoViewIfNeeded();
      const a = (await source.boundingBox())!,
        b = (await target.boundingBox())!;
      await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
      await page.mouse.down();
      await page.mouse.move(a.x + a.width / 2 + 12, a.y + a.height / 2, {
        steps: 5,
      });
      await page.waitForTimeout(150);
      await page.mouse.move(b.x + b.width / 2, Math.min(b.y + 25, 950), {
        steps: 25,
      });
      await page.waitForTimeout(250);
      assert.equal(
        await page.locator(".drag-zone").evaluateAll(
          (zones) =>
            zones.filter((zone) => {
              const style = getComputedStyle(zone);
              return (
                style.outlineStyle !== "none" && style.outlineWidth !== "0px"
              );
            }).length,
        ),
        0,
        "dragging must not outline every eligible container like a selection",
      );
      assert.ok(
        (await page.locator("[data-is-dnd-shadow-item-hint]").count()) > 0,
        "the insertion placeholder still identifies the drop position",
      );
      await page.mouse.up();
    }
    await drag(source, target);
    await page.screenshot({
      path: `/tmp/editor-drop-${integration}.png`,
      fullPage: true,
    });

    await page.waitForFunction(() =>
      window.changes.some(
        (c) =>
          Object.values(c.document.schema.properties).some(
            (p) => p.type === "string",
          ) && JSON.stringify(c.document.uischema).includes('"multi":true'),
      ),
    );
    assert.equal(
      await page.evaluate(() => window.changes.length),
      1,
      "drop commits exactly once",
    );
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    assert.equal(
      await page.evaluate(() =>
        JSON.stringify(window.changes.at(-1)!.document.uischema).includes(
          '"multi":true',
        ),
      ),
      false,
    );
    // Reorder an existing field with the library's keyboard interaction.
    const firstControl = page
      .getByRole("button", { name: "Drag Control", exact: true })
      .first();
    await firstControl.focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () =>
        window.changes.at(-1)!.document.uischema.elements![0].elements![0]
          .scope === "#/properties/lastName",
    );
    const schemaBefore = await page.evaluate(() =>
      JSON.stringify(window.changes.at(-1)!.document.schema),
    );
    await drag(
      page.getByRole("button", { name: "Drag field firstName", exact: true }),
      target,
    );
    await page.waitForFunction(() =>
      window.changes
        .at(-1)!
        .document.uischema.elements!.some(
          (node) => node.scope === "#/properties/firstName",
        ),
    );
    assert.equal(
      await page.evaluate(() =>
        JSON.stringify(window.changes.at(-1)!.document.schema),
      ),
      schemaBefore,
      "binding existing fields leaves schema unchanged",
    );
    await page.locator("#example").selectOption("combinator-properties");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Discard changes", exact: true })
      .click();
    const tabs = page.locator(".category-tab");
    const lastTab = (await tabs.count()) - 1;
    await tabs.last().click();
    await drag(
      page.getByRole("button", { name: "Drag textarea", exact: true }),
      page.locator("[data-drop-target]").nth(1),
    );
    await page.waitForFunction(
      (index) =>
        JSON.stringify(
          window.changes.at(-1)!.document.uischema.elements![index],
        ).includes('"multi":true'),
      lastTab,
    );
    assert.deepEqual(errors, []);
    await page.close();
    console.log(
      `Passed ${integration}: palette/schema/tab drops, atomic undo, keyboard reorder and splitters.`,
    );
  }
} finally {
  await browser.close();
}
