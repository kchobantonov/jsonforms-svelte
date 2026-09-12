import assert from "node:assert/strict";
import { chromium, type Page } from "playwright";
import { selectSource } from "./source-selection.ts";
const browser = await chromium.launch({ headless: true });
let page!: Page;
try {
  for (const integration of ["webcomponent", "native"]) {
    page = await browser.newPage({
      viewport: { width: 1600, height: 1100 },
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(process.env.EDITOR_DEMO_URL ?? "http://127.0.0.1:4178");
    await page
      .getByRole("heading", { name: "Form Definition", exact: true })
      .waitFor();
    await page.locator("#integration").selectOption(integration);
    assert.equal(await page.locator("#example").inputValue(), "new");
    assert.equal(
      await page.locator(".sample-select").count(),
      0,
      "default canvas is blank",
    );
    assert.equal(
      await page.getByRole("treeitem").count(),
      1,
      "only the root exists initially",
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
    await page.getByRole("button", { name: "text", exact: true }).click();
    await page.waitForFunction(() => window.changes.length === 1);
    assert.equal(
      await page.locator(".sample-select").count(),
      1,
      "new form can be authored without initial data",
    );
    await page.getByRole("button", { name: "New form", exact: true }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Discard changes", exact: true })
      .click();
    await page.waitForFunction(
      () =>
        document.querySelector<HTMLSelectElement>("#example")!.value === "new",
    );
    await page
      .getByRole("heading", { name: "Form Definition", exact: true })
      .waitFor();
    assert.equal(await page.locator(".sample-select").count(), 0);
    await page.getByRole("button", { name: "JSON Model", exact: true }).click();
    await page.locator(".monaco-editor").waitFor();
    for (const mode of ["dark", "light", "system"]) {
      await page.emulateMedia({ colorScheme: "dark" });
      await page.locator("#mode").selectOption(mode);
      await page.getByLabel("Source document", { exact: true }).click();
      const option = page.getByRole("option", { name: "schema", exact: true });
      await option.waitFor();
      const result = await option.evaluate((el) => {
        const content = el.closest('[data-slot="select-content"]')!;
        const color = getComputedStyle(content);
        const rgb = (value: string) =>
          value
            .match(/[\d.]+/g)!
            .slice(0, 3)
            .map(Number);
        const luminance = (value: string) =>
          rgb(value)
            .map((x) => {
              x /= 255;
              return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
            })
            .reduce(
              (sum, x, index) => sum + x * [0.2126, 0.7152, 0.0722][index],
              0,
            );
        const a = luminance(color.color),
          b = luminance(color.backgroundColor);
        return {
          ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
          inside: !!content.closest('.editor[aria-label="Form editor"]')!,
          dark: content.closest(".editor")?.classList.contains("dark")!,
        };
      });
      assert.ok(
        result.ratio >= 4.5,
        `${mode} dropdown contrast ${result.ratio}`,
      );
      assert.equal(
        result.inside,
        true,
        "popup stays within editor theme boundary",
      );
      assert.equal(result.dark, mode !== "light");
      await page.keyboard.press("Escape");
    }
    await selectSource(page, "schema");
    const schema = {
      type: "object",
      properties: {
        profile: { type: "object", properties: { name: { type: "string" } } },
        people: {
          type: "array",
          items: {
            type: "object",
            properties: { nickname: { type: "string" } },
          },
        },
      },
    };
    await page.locator(".monaco-editor").click({ position: { x: 140, y: 30 } });
    await page.keyboard.press("Control+a");
    await page.evaluate(
      (text) => navigator.clipboard.writeText(text),
      JSON.stringify(schema),
    );
    await page.keyboard.press("Control+v");
    await page.getByRole("button", { name: "Apply", exact: true }).click();
    await page.getByRole("radio", { name: "Design", exact: true }).click();
    await page
      .getByRole("treeitem", { name: "profile", exact: true })
      .waitFor();
    assert.equal(
      await page.getByRole("treeitem", { name: "name", exact: true }).count(),
      0,
    );
    assert.equal(
      await page
        .getByRole("tree", { name: "Schema", exact: true })
        .locator("[role=list], [role=listitem]")
        .count(),
      0,
      "DnD preserves tree semantics",
    );
    const profile = page.getByRole("treeitem", {
      name: "profile",
      exact: true,
    });
    await profile.focus();
    await page.keyboard.press("ArrowRight");
    await page.getByRole("treeitem", { name: "name", exact: true }).waitFor();
    await page.keyboard.press("ArrowLeft");
    assert.equal(await profile.getAttribute("aria-expanded"), "false");
    await page
      .getByRole("button", { name: "Expand people", exact: true })
      .click();
    await page.getByRole("treeitem", { name: "items", exact: true }).waitFor();
    await page
      .getByRole("button", { name: "Expand items", exact: true })
      .click();
    await page
      .getByRole("treeitem", { name: "nickname", exact: true })
      .waitFor();

    for (const name of ["profile", "people"]) {
      const source = page.getByRole("button", {
        name: `Drag field ${name}`,
        exact: true,
      });
      await source.scrollIntoViewIfNeeded();
      const a = (await source.boundingBox())!,
        b = (await page.locator("[data-drop-target]").first().boundingBox())!;
      await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
      await page.mouse.down();
      await page.mouse.move(a.x + a.width / 2 + 12, a.y + a.height / 2, {
        steps: 5,
      });
      await page.waitForTimeout(150);
      await page.mouse.move(b.x + b.width / 2, b.y + 20, { steps: 25 });
      await page.waitForTimeout(250);
      await page.mouse.up();
      await page.waitForFunction(
        (name) =>
          window.changes
            .at(-1)!
            .document.uischema.elements!.some(
              (node) => node.scope === `#/properties/${name}`,
            ),
        name,
      );
      assert.deepEqual(
        await page.evaluate(() => window.changes.at(-1)!.document.schema),
        schema,
        "container binding preserves its schema",
      );
    }
    assert.equal(
      await page.evaluate(
        () => window.changes.at(-1)!.document.uischema.elements!.length,
      ),
      2,
    );
    await page.getByRole("button", { name: "New form", exact: true }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Cancel", exact: true })
      .click();
    assert.equal(
      await page.locator(".sample-select").count(),
      2,
      "cancel preserves work",
    );
    await page
      .locator("#integration")
      .selectOption(integration === "native" ? "webcomponent" : "native");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Cancel", exact: true })
      .click();
    assert.equal(
      await page.locator("#integration").inputValue(),
      integration,
      "cancel preserves integration",
    );
    const exampleBefore = await page.locator("#example").inputValue();
    await page.locator("#example").selectOption("main");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Cancel", exact: true })
      .click();
    assert.equal(
      await page.locator("#example").inputValue(),
      exampleBefore,
      "cancel preserves example",
    );

    await page.getByRole("button", { name: "New form", exact: true }).click();
    await page.getByRole("dialog").waitFor();
    assert.equal(
      await page
        .getByRole("dialog")
        .evaluate((el) => Boolean(el.closest(".demo-toolbar"))),
      true,
      "dialog inherits toolbar theme",
    );
    await page.keyboard.press("Escape");
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    assert.equal(
      await page.locator(".sample-select").count(),
      2,
      "Escape preserves work",
    );

    await page.getByRole("button", { name: "New form", exact: true }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Discard changes", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Form Definition", exact: true })
      .waitFor();
    assert.equal(await page.locator(".sample-select").count(), 0);
    assert.deepEqual(errors, []);
    await page.close();

    console.log(
      `Passed ${integration}: blank default/new form, themed source dropdown, expandable tree and whole object/array drops.`,
    );
  }
} catch (error) {
  await page
    ?.screenshot({ path: "/tmp/editor-tree-theme-failure.png", fullPage: true })
    .catch(() => {});
  throw error;
} finally {
  await browser.close();
}
