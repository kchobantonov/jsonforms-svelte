import schemaMeta from "../monaco/schema-meta.json" with { type: "json" };
import { RuleEffect, createAjv } from "@jsonforms/core";
import {
  at,
  clone,
  designRoot,
  object,
  type Document,
} from "../document/commands/index.js";
export const effects = Object.values(RuleEffect);
const ajv = createAjv({ strict: false });
const conditionMeta = JSON.parse(
  JSON.stringify(schemaMeta, (key, value) =>
    key === "$id" || key === "$schema"
      ? undefined
      : key === "$ref" && typeof value === "string" && value.startsWith("#")
        ? "#/definitions/conditionSchema" + value.slice(1)
        : value,
  ),
);
export const ruleSchema = {
  definitions: { conditionSchema: conditionMeta },
  type: "object",
  required: ["effect", "condition"],
  properties: {
    effect: { type: "string", enum: effects },
    condition: {
      type: "object",
      required: ["scope", "schema"],
      properties: {
        scope: { type: "string", pattern: "^#($|/)" },
        schema: { $ref: "#/definitions/conditionSchema" },
        failWhenUndefined: { type: "boolean" },
      },
    },
  },
};
const validate = ajv.compile(ruleSchema);
export function validateRule(value: unknown) {
  if (!validate(value))
    throw new Error("Enter a valid effect, scope and condition schema.");
  createAjv({ strict: false }).compile(object(object(value).condition).schema as object);
}
export function setRule(
  doc: Document,
  path: number[],
  rule: unknown,
): Document {
  if (rule !== undefined) validateRule(rule);
  const next = clone(doc);
  if (!next.uischema)
    throw new Error("Add an element before defining its rule.");
  const node = at(designRoot(next), path);
  if (rule === undefined) delete node.rule;
  else node.rule = clone(rule) as typeof node.rule;
  return next;
}
export const operators = [
  "equals",
  "one of",
  "pattern",
  "minimum",
  "maximum",
] as const;
export function visualRule(rule: unknown) {
  const r = object(rule),
    c = object(r.condition),
    s = object(c.schema);
  if (
    c.schema === null ||
    typeof c.schema !== "object" ||
    Array.isArray(c.schema)
  )
    return undefined;
  const entries = Object.entries(s);
  if (s.const !== null && typeof s.const === "object") return undefined;
  if (Array.isArray(s.enum) && s.enum.some(value => (value !== null && typeof value === "object") || typeof value !== typeof (s.enum as unknown[])[0])) return undefined;

  if (
    entries.length !== 1 ||
    !["const", "enum", "pattern", "minimum", "maximum"].includes(entries[0][0])
  )
    return undefined;
  return {
    effect: String(r.effect),
    scope: String(c.scope),
    operator:
      ({ const: "equals", enum: "one of" } as Record<string, string>)[
        entries[0][0]
      ] ?? entries[0][0],
    value: entries[0][1],
    failWhenUndefined: c.failWhenUndefined === true,
  };
}
export function fromVisual(base: unknown, data: Record<string, unknown>) {
  const keyword =
    ({ equals: "const", "one of": "enum" } as Record<string, string>)[
      String(data.operator)
    ] ?? String(data.operator);
  return {
    ...object(base),
    effect: data.effect,
    condition: {
      ...object(object(base).condition),
      scope: data.scope,
      schema: { [keyword]: data.value },
      failWhenUndefined: data.failWhenUndefined,
    },
  };
}
