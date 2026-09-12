import { relative, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

test("host shadcn sources match the existing repository component set exactly", () => {
  const local = new URL(
    "../../jsonforms-svelte-editor-webcomponent/src/components/ui/",
    import.meta.url,
  );
  const baseline = new URL(
    "../../jsonforms-svelte-shadcn-webcomponent/src/lib/components/ui/",
    import.meta.url,
  );
  const files = (root: URL) =>
    readdirSync(root, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) =>
        relative(fileURLToPath(root), join(entry.parentPath, entry.name)),
      )
      .sort();
  assert.deepEqual(files(local), files(baseline));
  for (const file of files(baseline)) {
    assert.equal(
      readFileSync(new URL(file, local), "utf8"),
      readFileSync(new URL(file, baseline), "utf8"),
      file,
    );
  }
});

test("editor interactive controls use shared shadcn primitives", () => {
  const root = new URL("../src/lib/editor/", import.meta.url);
  for (const entry of readdirSync(root, {
    recursive: true,
    withFileTypes: true,
  })) {
    if (!entry.isFile() || !entry.name.endsWith(".svelte")) continue;
    const path = join(entry.parentPath, entry.name);
    assert.doesNotMatch(
      readFileSync(path, "utf8"),
      /<(?:button|select|input|textarea)(?:\s|>)/,
      `${path}: a native-control exception requires documented owner awareness`,
    );
  }
});
