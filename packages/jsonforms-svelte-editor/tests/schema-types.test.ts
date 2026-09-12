import { test } from "node:test";
import assert from "node:assert/strict";
import {
  initialize,
  insert,
  designRoot,
  updateProperties,
  clone,
} from "../dist/editor/document/commands/index.js";
import { editSchema } from "../dist/editor/document/schema-edit.js";
import { inspectorDefinition } from "../dist/editor/inspector/definition.js";
import { applyDrop } from "../dist/editor/dnd/drop-handler.js";
import { elementId } from "../dist/editor/document/identity.js";

test("schema-only documents stay schema-only until authoring a control", () => {
  const model = {
    schema: { type: "object", properties: { text: { type: "string" } } },
  };
  const doc = initialize(model);
  assert.deepEqual(clone(doc), model);
  const root = designRoot(doc);
  assert.deepEqual(root.elements, []);
  const next = applyDrop(
    doc,
    { kind: "schema-property", pointer: "#/properties/text" },
    elementId(root),
    0,
  );
  assert.equal(next.uischema?.elements?.[0].scope, "#/properties/text");
  assert.equal(doc.uischema, undefined);
  const preset = applyDrop(doc, { kind: "palette-item", preset: "text" }, elementId(root), 0);
  assert.equal(preset.uischema?.elements?.length, 1);
});

test("visual schema authoring and inspector preserve single and union types", () => {
  let doc = editSchema(initialize({}), {
    action: "add",
    pointer: "#",
    name: "value",
    type: ["string", "number"],
  });
  assert.deepEqual(doc.schema.properties.value.type, ["string", "number"]);
  doc = insert(doc, [], {
    type: "Control",
    scope: "#/properties/value",
    options: { multi: true },
  });
  assert.deepEqual(
    inspectorDefinition(doc, doc.uischema.elements[0]).data.schemaTypes,
    ["string", "number"],
  );
  doc = updateProperties(doc, [0], {
    label: "Value",
    multi: false,
    required: false,
    schemaTypes: ["boolean"],
  });
  assert.equal(doc.schema.properties.value.type, "boolean");
  assert.equal(doc.uischema.elements[0].options?.multi, undefined);
});
