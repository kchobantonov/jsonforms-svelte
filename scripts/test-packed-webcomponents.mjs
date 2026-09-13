import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { chromium } from "playwright";

const artifacts = path.resolve(
  process.argv[2] ?? path.join(tmpdir(), "jsonforms-release-packs"),
);
const overrides = JSON.parse(
  readFileSync(path.join(artifacts, "overrides.json"), "utf8"),
);
const staging = mkdtempSync(path.join(tmpdir(), "jsonforms-packed-browser-"));
const server = createServer((request, response) => {
  try {
    const pathname = new URL(request.url, "http://localhost").pathname;
    if (pathname === "/") {
      response.setHeader("Content-Type", "text/html");
      response.end("<!doctype html><html><body></body></html>");
      return;
    }
    const file = path.resolve(staging, "." + decodeURIComponent(pathname));
    if (!file.startsWith(staging + path.sep)) throw new Error("Invalid path");
    response.setHeader(
      "Content-Type",
      file.endsWith(".css")
        ? "text/css"
        : file.endsWith(".js")
          ? "text/javascript"
          : "application/octet-stream",
    );
    response.end(readFileSync(file));
  } catch {
    response.writeHead(404);
    response.end();
  }
});
let browser;
try {
  for (const style of ["flowbite", "skeleton", "shadcn"]) {
    const directory = path.join(staging, style);
    mkdirSync(directory);
    execFileSync("tar", [
      "-xzf",
      overrides[`@chobantonov/jsonforms-svelte-${style}-webcomponent`].slice(5),
      "-C",
      directory,
    ]);
  }
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch();
  for (const style of ["flowbite", "skeleton", "shadcn"]) {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("response", (response) => {
      if (response.status() >= 400)
        errors.push(`${response.status()} ${response.url()}`);
    });
    await page.goto(base);
    await page.evaluate(async (style) => {
      await import(`/${style}/package/dist/jsonforms-svelte-${style}.js`);
      await customElements.whenDefined(`jsonforms-svelte-${style}`);
      const form = document.createElement(`jsonforms-svelte-${style}`);
      form.schema = {
        type: "object",
        properties: { name: { type: "string" } },
        required: ["name"],
      };
      form.uischema = {
        type: "VerticalLayout",
        elements: [{ type: "Control", scope: "#/properties/name" }],
      };
      form.data = { name: "Ada" };
      form.mode = "dark";
      form.addEventListener("change", (event) => {
        if (event instanceof CustomEvent) window.formChange = event.detail;
      });
      document.body.append(form);
    }, style);
    const input = page.getByRole("textbox");
    await input.waitFor();
    assert.equal(await input.inputValue(), "Ada");
    await input.fill("Grace");
    await page.waitForFunction(() => window.formChange?.data?.name === "Grace");
    await page.evaluate((style) => {
      document.querySelector(`jsonforms-svelte-${style}`).readonly = true;
    }, style);
    await page.waitForFunction(() => {
      const input =
        document.body.firstElementChild.shadowRoot.querySelector("input");
      return input.disabled || input.readOnly;
    });
    assert.deepEqual(
      errors,
      [],
      `${style}: browser errors or missing packed assets`,
    );
    console.log(
      `${style}: packed browser registration, rendering, data changes, readonly and assets passed`,
    );
    await page.close();
  }
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
  rmSync(staging, { recursive: true, force: true });
}
