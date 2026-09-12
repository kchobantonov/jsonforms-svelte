import { test } from "node:test";
import assert from "node:assert/strict";
import { inspectorDefinition } from "../dist/editor/inspector/definition.js";
import {
  initialize,
  updateProperties,
} from "../dist/editor/document/commands/index.js";
test("inspector exposes only implemented element/type properties", () => {
  const doc = initialize({
    schema: {
      type: "object",
      properties: { active: { type: "boolean" }, text: { type: "string" } },
    },
  });
  assert.equal(inspectorDefinition(doc, { type: "VerticalLayout", elements: [] }).fields.length, 0);
  assert.equal(
    inspectorDefinition(doc, {
      type: "Control",
      scope: "#/properties/active",
    }).fields.some((f) => f.key === "multi"),
    false,
  );
  assert.equal(
    inspectorDefinition(doc, {
      type: "Control",
      scope: "#/properties/text",
    }).fields.some((f) => f.key === "multi"),
    true,
  );
  const group = inspectorDefinition(doc, { type: "Group", elements: [] });
  assert.ok(group.fields.some((f) => f.key === "showDataIndicator"));
  assert.deepEqual(group.data, {});
});
test("schema validation and Group options preserve unrelated authored content", () => {
  const doc = initialize({
    schema: {
      type: "object",
      properties: { text: { type: "string", custom: true } },
    },
    uischema: {
      type: "Group",
      label: "Contact",
      options: { custom: 1 },
      elements: [
        { type: "Control", scope: "#/properties/text", options: { custom: 2 } },
      ],
    },
  });
  const grouped = updateProperties(doc, [], {
    label: "Contact",
    multi: false,
    required: false,
    collapsible: true,
    showDataIndicator: true,
  });
  assert.deepEqual(grouped.uischema.options, {
    custom: 1,
    collapsible: true,
    showDataIndicator: true,
  });
  const updated = updateProperties(grouped, [0], {
    label: "Text",
    multi: true,
    required: true,
    minLength: 2,
    schemaDescription: "Description",
  });
  assert.deepEqual(updated.schema, {
    type: "object",
    properties: {
      text: {
        type: "string",
        custom: true,
        minLength: 2,
        description: "Description",
      },
    },
    required: ["text"],
  });
  assert.deepEqual(updated.uischema.elements?.[0].options, {
    custom: 2,
    multi: true,
  });
});

test("clearing an inspector label removes the authored override", () => {
  const doc = initialize({
    schema: { type: "object", properties: { text: { type: "string" } } },
    uischema: {
      type: "Control",
      scope: "#/properties/text",
      label: "Custom label",
      options: { custom: true },
    },
  });
  const updated = updateProperties(doc, [], {
    label: undefined,
  });
  assert.equal(Object.hasOwn(updated.uischema!, "label"), false);
  assert.deepEqual(updated.uischema!.options, { custom: true });
  assert.equal(doc.uischema!.label, "Custom label");
});

test("inspector patches preserve explicit empty labels and untouched properties", () => {
  const doc = initialize({
    schema: { type: "object", properties: { text: { type: "string" } }, required: ["text"] },
    uischema: { type: "Control", scope: "#/properties/text", label: false, options: { multi: true } },
  });
  const unchanged = updateProperties(doc, [], {});
  assert.deepEqual(unchanged, doc);
  const empty = updateProperties(doc, [], { label: "" });
  assert.equal(empty.uischema!.label, "");
  const cleared = updateProperties(doc, [], { multi: undefined });
  assert.equal(Object.hasOwn(cleared.uischema!, "options"), false);
  assert.deepEqual(cleared.schema, doc.schema);
});
