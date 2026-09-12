import assert from "node:assert/strict";
import { test } from "node:test";
import { schemaTree } from "../dist/editor/document/schema-tree.js";
import {
  schemaOccurrences,
  unusedSchemaTree,
} from "../dist/editor/document/schema-usage.js";
test("usage preserves duplicate placements and unused descendants of used containers", () => {
  const scope = "#/properties/person";
  const root = schemaTree({
    type: "object",
    properties: {
      person: { type: "object", properties: { name: { type: "string" } } },
      active: { type: "boolean" },
    },
  });
  const occurrences = schemaOccurrences({
    type: "VerticalLayout",
    elements: [
      { type: "Control", scope },
      { type: "Group", label: "Other", elements: [{ type: "Control", scope }] },
    ],
  });
  assert.deepEqual(
    occurrences.map((item) => item.path),
    [[0], [1, 0]],
  );
  assert.notEqual(occurrences[0].label, occurrences[1].label);
  const filtered = unusedSchemaTree(
    root,
    new Set([scope, "#/properties/active"]),
  )!;
  assert.equal(filtered.children.length, 1);
  assert.equal(filtered.children[0].bindable, false);
  assert.equal(filtered.children[0].children[0].bindable, true);
  assert.equal(
    unusedSchemaTree(
      root,
      new Set(["#", scope, scope + "/properties/name", "#/properties/active"]),
    ),
    undefined,
  );
});
