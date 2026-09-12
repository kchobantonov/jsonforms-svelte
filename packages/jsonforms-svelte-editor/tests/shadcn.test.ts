import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("editor shadcn sources match the existing repository component set exactly", () => {
  for (const file of ["button/button.svelte", "utils.ts"]) {
    const local = new URL(`../src/lib/components/ui/${file}`, import.meta.url);
    const baseline = new URL(
      `../../jsonforms-svelte-shadcn-webcomponent/src/lib/components/ui/${file}`,
      import.meta.url,
    );
    assert.equal(
      readFileSync(local, "utf8"),
      readFileSync(baseline, "utf8"),
      file,
    );
  }
});
