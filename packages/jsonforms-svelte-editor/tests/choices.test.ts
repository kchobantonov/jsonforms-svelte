import assert from "node:assert/strict";
import { test } from "node:test";
import {
  initialize,
  addPreset,
  updateProperties,
  properties,
  object,
} from "../dist/editor/document/commands/index.js";
import { inspectorDefinition } from "../dist/editor/inspector/definition.js";
test("presentation presets do not create data fields and expose applicable options", () => {
  let doc = initialize({});
  for (const preset of ["Separator", "Spacer", "ImageView"])
    doc = addPreset(doc, [], preset);
  assert.deepEqual(object(doc.schema).properties, {});
  assert.equal(
    inspectorDefinition(doc, doc.uischema.elements![1]).data.height,
    32,
  );
  doc = updateProperties(doc, [2], {
    label: "",
    multi: false,
    required: false,
    src: "/logo.png",
    alt: "Logo",
  });
  assert.deepEqual(doc.uischema.elements![2].options, {
    src: "/logo.png",
    alt: "Logo",
  });
});
test("selection presets and choice conversions support scalar and array options", () => {
  for (const preset of ["Select", "Radio group", "Checkbox group"]) {
    let doc = addPreset(initialize({}), [], preset);
    let node = doc.uischema.elements![0];
    const form = inspectorDefinition(doc, node);
    assert.ok(form.fields.some((field) => field.key === "choiceMode"));
    assert.ok(!form.fields.some((field) => field.key === "multi"));
    doc = updateProperties(doc, [0], {
      ...properties(doc, node),
      ...form.data,
      choiceMode: "oneOf",
      choiceRows: [
        { value: "a", title: "Alpha" },
        { value: "b", title: "Beta" },
      ],
    });
    const schema = object(object(object(doc.schema).properties).text);
    const target = preset === "Checkbox group" ? object(schema.items) : schema;
    assert.deepEqual(target.oneOf, [
      { const: "a", title: "Alpha" },
      { const: "b", title: "Beta" },
    ]);
    assert.equal(target.enum, undefined);
    if (preset === "Checkbox group") assert.equal(schema.uniqueItems, true);
    node = doc.uischema.elements![0];
    assert.throws(
      () =>
        updateProperties(doc, [0], {
          ...properties(doc, node),
          choiceMode: "enum",
          choiceRows: [{ value: "a" }, { value: "a" }],
        }),
      /unique/,
    );
  }
});
