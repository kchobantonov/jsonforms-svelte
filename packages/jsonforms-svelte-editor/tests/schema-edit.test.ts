import assert from "node:assert/strict";
import { initialize } from "../dist/editor/document/commands/index.js";
import {
  editSchema,
  definitionPointers,
} from "../dist/editor/document/schema-edit.js";
import { schemaTree } from "../dist/editor/document/schema-tree.js";
let doc = initialize({
  schema: { type: "object", properties: {} },
  uischema: { type: "VerticalLayout", elements: [] },
});
doc = editSchema(doc, {
  action: "definition",
  pointer: "#",
  name: "Address",
  type: "object",
});
assert.deepEqual(definitionPointers(doc.schema), ["#/definitions/Address"]);
doc = editSchema(doc, {
  action: "add",
  pointer: "#/definitions/Address",
  name: "street",
  type: "string",
});
doc = editSchema(doc, {
  action: "add",
  pointer: "#",
  name: "address",
  type: "#/definitions/Address",
});
assert.throws(
  () => editSchema(doc, { action: "delete", pointer: "#/definitions/Address" }),
  /referenced/,
);
doc = editSchema(doc, {
  action: "rename",
  pointer: "#/definitions/Address",
  name: "Location",
});
assert.equal(
  (doc.schema as any).properties.address.$ref,
  "#/definitions/Location",
);
assert.equal(
  schemaTree(doc.schema).children.find(
    (n) => n.pointer === "#/definitions/Location",
  )?.bindable,
  false,
);
const modern = editSchema(
  initialize({
    schema: {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: {},
    },
  }),
  { action: "definition", pointer: "#", name: "Thing", type: "object" },
);
assert.deepEqual(definitionPointers(modern.schema), ["#/$defs/Thing"]);
doc = editSchema(doc, {
  action: "add",
  pointer: "#",
  name: "people",
  type: "array",
});
doc = editSchema(doc, {
  action: "add",
  pointer: "#/properties/people/items",
  name: "first/name",
  type: "string",
});
(doc.schema as any).properties.people.items.required = ["first/name"];
doc.data = { people: [{ "first/name": "Ada" }] };
doc.uischema.elements = [
  {
    type: "Control",
    scope: "#/properties/people/items/properties/first~1name",
  },
];
const before = JSON.stringify(doc);
assert.throws(
  () =>
    editSchema(doc, {
      action: "delete",
      pointer: "#/properties/people/items/properties/first~1name",
    }),
  /referenced/,
);
assert.equal(JSON.stringify(doc), before);
doc = editSchema(doc, {
  action: "rename",
  pointer: "#/properties/people/items/properties/first~1name",
  name: "name",
});
assert.equal(
  doc.uischema.elements![0].scope,
  "#/properties/people/items/properties/name",
);
assert.deepEqual(doc.data, { people: [{ name: "Ada" }] });
assert.deepEqual((doc.schema as any).properties.people.items.required, [
  "name",
]);
assert.throws(
  () =>
    editSchema(doc, {
      action: "add",
      pointer: "#",
      name: "people",
      type: "string",
    }),
  /already exists/,
);
doc.uischema.elements = [];
doc = editSchema(doc, {
  action: "delete",
  pointer: "#/properties/people/items/properties/name",
});
assert.deepEqual(doc.data, { people: [{}] });
assert.equal((doc.schema as any).properties.people.items.required, undefined);
let referenced = initialize({
  schema: {
    type: "object",
    properties: { home: { $ref: "#/definitions/Address" } },
    definitions: {
      Address: {
        type: "object",
        properties: { street: { type: "string" } },
        required: ["street"],
      },
    },
  },
  data: { home: { street: "Main" } },
});
referenced = editSchema(referenced, {
  action: "rename",
  pointer: "#/definitions/Address/properties/street",
  name: "road",
});
assert.deepEqual(referenced.data, { home: { road: "Main" } });
const array = editSchema(referenced, {
  action: "add",
  pointer: "#",
  name: "tags",
  type: "array",
  itemType: "string",
});
assert.deepEqual((array.schema as any).properties.tags, {
  type: "array",
  items: { type: "string" },
});
const literals = initialize({
  schema: {
    type: "object",
    properties: { name: { type: "string" } },
    default: { $ref: "#/properties/name" },
    dependentRequired: { other: ["name"] },
  },
  uischema: {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/name",
        rule: {
          effect: "HIDE",
          condition: { scope: "#/properties/name", schema: { const: "" } },
        },
      },
    ],
  },
  uischemas: [{ uischema: { type: "Control", scope: "#/properties/name" } }],
});
const renamed = editSchema(literals, {
  action: "rename",
  pointer: "#/properties/name",
  name: "title",
});
assert.deepEqual((renamed.schema as any).default, {
  $ref: "#/properties/name",
});
assert.deepEqual((renamed.schema as any).dependentRequired, {
  other: ["title"],
});
assert.equal(
  (renamed.uischema.elements![0] as any).rule.condition.scope,
  "#/properties/title",
);
assert.equal(
  (renamed.uischemas![0] as any).uischema.scope,
  "#/properties/title",
);
