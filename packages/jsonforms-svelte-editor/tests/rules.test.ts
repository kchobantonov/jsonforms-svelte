import { test } from "node:test";
import assert from "node:assert/strict";
import { initialize } from "../dist/editor/document/commands/index.js";
import {
  effects,
  setRule,
  validateRule,
  visualRule,
  fromVisual,
} from "../dist/editor/rules/model.js";
import { ruleMatch } from "../dist/editor/rules/evaluation.js";
const doc = initialize({
  schema: { type: "object", properties: { country: { type: "string" } } },
  uischema: {
    type: "VerticalLayout",
    elements: [
      { type: "Control", scope: "#/properties/country" },
      { type: "Control", scope: "#/properties/country" },
    ],
  },
});
test("all effects persist on exactly one UI occurrence; removal and invalid conditions are atomic", () => {
  assert.equal(effects.length, 6);
  for (const effect of effects) {
    const rule = {
      effect,
      condition: {
        scope: "#/properties/country",
        schema: { const: "BG" },
        failWhenUndefined: true,
      },
    };
    const next = setRule(doc, [0], rule);
    assert.deepEqual(next.uischema.elements[0].rule, rule);
    assert.equal(next.uischema.elements[1].rule, undefined);
    assert.equal(doc.uischema.elements[0].rule, undefined);
    assert.equal(
      setRule(next, [0], undefined).uischema.elements[0].rule,
      undefined,
    );
    assert.equal(ruleMatch(rule, { country: "BG" }, {}), "Matches");
    assert.equal(ruleMatch(rule, {}, {}), "Does not match");
  }
  assert.throws(() => validateRule({ effect: "BAD", condition: {} }));
});
test("visual round trips preserve extensions and advanced JSON stays out of the simple builder", () => {
  const rule = {
    effect: "SHOW",
    extension: 1,
    condition: {
      scope: "#/properties/country",
      schema: { const: "BG" },
      extra: "keep",
      failWhenUndefined: false,
    },
  };
  assert.deepEqual(fromVisual(rule, visualRule(rule)), rule);
  assert.equal(
    visualRule({
      effect: "HIDE",
      condition: { scope: "#", schema: { allOf: [{ required: ["country"] }] } },
    }),
    undefined,
  );
});
