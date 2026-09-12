import { test } from "node:test";
import assert from "node:assert/strict";
import {
  schemaTree,
  visibleSchemaNodes,
} from "../dist/editor/document/schema-tree.js";
test("schema tree keeps draggable objects and arrays as parents with escaped child pointers", () => {
  const schema = {
    type: "object",
    properties: {
      "a/b": { type: "object", properties: { "c~d": { type: "string" } } },
      rows: {
        type: "array",
        items: { type: "object", properties: { name: { type: "string" } } },
      },
    },
  };
  const root = schemaTree(schema);
  assert.equal(root.children[0].pointer, "#/properties/a~1b");
  assert.equal(
    root.children[0].children[0].pointer,
    "#/properties/a~1b/properties/c~0d",
  );
  assert.equal(root.children[0].bindable, true);
  assert.equal(root.children[1].type, "array");
  assert.equal(root.children[1].bindable, true);
  assert.equal(root.children[1].children[0].label, "items");
  assert.equal(root.children[1].children[0].bindable, false);
  assert.equal(root.children[1].children[0].children[0].bindable, false);
  assert.equal(visibleSchemaNodes(root, new Set(["#"])).length, 3);
  assert.equal(
    visibleSchemaNodes(root, new Set(["#", "#/properties/a~1b"])).length,
    4,
  );
  assert.deepEqual(schema.properties.rows.items.properties, {
    name: { type: "string" },
  });
});
test("tree represents primitive/boolean roots and tuple item structure without inventing properties", () => {
  assert.equal(schemaTree(false).type, "never");
  assert.equal(schemaTree({ type: "string" }).pointer, "#");
  assert.equal(schemaTree({ type: "string" }).children.length, 0);
  const root = schemaTree({
    type: "array",
    prefixItems: [{ type: "string" }, { type: "number" }],
  });
  assert.deepEqual(
    root.children.map((node) => node.pointer),
    ["#/prefixItems/0", "#/prefixItems/1"],
  );
});
