import {
  object,
  type Node,
  type ObjectValue,
} from "../document/commands/index.js";
import type { JsonValue } from "../document/types.js";
export function choiceDefinition(schema: ObjectValue) {
  const target = schema.type === "array" ? object(schema.items) : schema;
  const values = Array.isArray(target.enum)
    ? target.enum
    : Array.isArray(target.oneOf) &&
        target.oneOf.every((item) => "const" in object(item))
      ? target.oneOf.map((item) => object(item).const)
      : undefined;
  if (!values?.length) return undefined;
  const type = typeof values[0];
  if (
    !["string", "number", "boolean"].includes(type) ||
    !values.every((value) => typeof value === type)
  )
    return undefined;
  return {
    target,
    type,
    mode: Array.isArray(target.enum) ? "enum" : "oneOf",
    rows: values.map((value, index) => ({
      value,
      title: Array.isArray(target.oneOf)
        ? String(object(target.oneOf[index]).title ?? value)
        : String(value),
    })),
  };
}
export function applyChoiceProperties(
  schema: ObjectValue,
  node: Node,
  data: Record<string, unknown>,
) {
  if (node.type !== "Control") return;
  const definition = choiceDefinition(schema);
  if (!definition) return;
  if ("choiceWidget" in data && schema.type !== "array") {
    const options = object(node.options);
    if (data.choiceWidget === "radio") options.format = "radio";
    else if (data.choiceWidget === "select" && options.format === "radio")
      delete options.format;
    if (Object.keys(options).length) node.options = options;
    else delete node.options;
  }
  if (!("choiceMode" in data) || !("choiceRows" in data)) return;
  if (
    !["enum", "oneOf"].includes(String(data.choiceMode)) ||
    !Array.isArray(data.choiceRows) ||
    !data.choiceRows.length
  )
    throw new Error("Provide at least one choice.");
  const rows = data.choiceRows.map((row) => object(row));
  if (rows.some((row) => typeof row.value !== definition.type))
    throw new Error("Choice values must match the existing value type.");
  if (
    new Set(rows.map((row) => JSON.stringify(row.value))).size !== rows.length
  )
    throw new Error("Choice values must be unique.");
  if (
    data.choiceMode === definition.mode &&
    JSON.stringify(rows) === JSON.stringify(definition.rows)
  )
    return;
  const target = definition.target;
  if (data.choiceMode === "enum") {
    target.enum = rows.map((row) => row.value);
    delete target.oneOf;
  } else {
    target.oneOf = rows.map((row) => ({
      ...object(
        Array.isArray(target.oneOf)
          ? target.oneOf.find((item) => object(item).const === row.value)
          : undefined,
      ),
      const: row.value,
      title: String(row.title ?? row.value),
    })) as JsonValue[];
    delete target.enum;
  }
}
