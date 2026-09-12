import {
  clone,
  object,
  escapePointer,
  type Document,
} from "./commands/index.js";
import type { JsonValue } from "./types.js";
export type SchemaEdit = {
  action: "add" | "definition" | "rename" | "delete";
  pointer: string;
  name?: string;
  type?: string | string[];
  itemType?: string;
};
const parts = (pointer: string) =>
  pointer === "#"
    ? []
    : pointer
        .slice(2)
        .split("/")
        .map((p) => p.replace(/~1/g, "/").replace(/~0/g, "~"));
function get(root: unknown, path: string[]): any {
  return path.reduce<any>((value, key) => value?.[key], root);
}
const within = (value: string, pointer: string) =>
  value === pointer || value.startsWith(pointer + "/");
function visit(
  value: unknown,
  callback: (record: Record<string, any>) => void,
) {
  if (!value || typeof value !== "object") return;
  if (!Array.isArray(value)) callback(value as Record<string, any>);
  Object.values(value).forEach((child) => visit(child, callback));
}
function visitSchema(
  value: unknown,
  callback: (record: Record<string, any>) => void,
) {
  const schema = object(value);
  callback(schema);
  for (const keyword of [
    "properties",
    "patternProperties",
    "$defs",
    "definitions",
    "dependentSchemas",
    "dependencies",
  ])
    Object.values(object(schema[keyword])).forEach((child) => {
      if (!Array.isArray(child)) visitSchema(child, callback);
    });
  for (const keyword of [
    "items",
    "prefixItems",
    "allOf",
    "anyOf",
    "oneOf",
    "not",
    "if",
    "then",
    "else",
    "contains",
    "additionalProperties",
    "additionalItems",
    "unevaluatedProperties",
    "unevaluatedItems",
    "propertyNames",
  ]) {
    const child = schema[keyword];
    if (Array.isArray(child))
      child.forEach((item) => visitSchema(item, callback));
    else if (child && typeof child === "object") visitSchema(child, callback);
  }
}
export function definitionPointers(schema: unknown): string[] {
  return ["$defs", "definitions"].flatMap((keyword) =>
    Object.keys(object(object(schema)[keyword])).map(
      (name) => `#/${keyword}/${escapePointer(name)}`,
    ),
  );
}
function newSchema(
  type: string | string[],
  schema: unknown,
  itemType = "object",
): JsonValue {
  if (Array.isArray(type)) {
    if (
      !type.length ||
      type.some(
        (entry) =>
          ![
            "string",
            "number",
            "integer",
            "boolean",
            "object",
            "array",
            "null",
          ].includes(entry),
      )
    )
      throw new Error("Choose a schema type.");
    const unique = [...new Set(type)];
    if (unique.length === 1) return newSchema(unique[0], schema, itemType);
    return {
      type: unique,
      ...(unique.includes("object") ? { properties: {} } : {}),
      ...(unique.includes("array")
        ? {
            items: newSchema(
              itemType === "array" ? "object" : itemType,
              schema,
            ),
          }
        : {}),
    };
  }
  if (type.startsWith("#/")) {
    if (!definitionPointers(schema).includes(type))
      throw new Error("Choose an existing definition.");
    return { $ref: type };
  }
  if (type === "object") return { type, properties: {} };
  if (type === "array")
    return {
      type,
      items: newSchema(itemType === "array" ? "object" : itemType, schema),
    };
  if (!["string", "number", "integer", "boolean", "null"].includes(type))
    throw new Error("Choose a schema type.");
  return { type };
}
/** Atomic schema edits. Referenced deletions are rejected; renames preserve local bindings. */
export function editSchema(document: Document, edit: SchemaEdit): Document {
  const next = clone(document);
  const path = parts(edit.pointer);
  const node = get(next.schema, path);
  if (node === undefined) throw new Error("The schema node no longer exists.");
  const name = edit.name?.trim() ?? "";
  if (edit.action !== "delete" && !name) throw new Error("Enter a name.");
  if (["__proto__", "constructor", "prototype"].includes(name))
    throw new Error("Choose a different name.");
  if (edit.action === "add" || edit.action === "definition") {
    if (!node || typeof node !== "object" || Array.isArray(node))
      throw new Error("Select an object schema.");
    const keyword =
      edit.action === "definition"
        ? String(object(next.schema).$schema ?? "").match(/2019-09|2020-12/)
          ? "$defs"
          : "definitions"
        : "properties";
    if (
      edit.action === "add" &&
      (node.$ref || !(node.type === "object" || node.properties))
    )
      throw new Error("Select an object schema.");
    if (edit.action === "definition" && path.length)
      throw new Error("Definitions belong to the root schema.");
    node[keyword] ??= {};
    if (Object.hasOwn(node[keyword], name))
      throw new Error("That name already exists.");
    node[keyword][name] = newSchema(
      edit.type ?? "string",
      next.schema,
      edit.itemType,
    );
    return next;
  }
  const keyword = path.at(-2);
  if (!["properties", "$defs", "definitions"].includes(keyword ?? ""))
    throw new Error(
      "Only properties and definitions can be renamed or deleted.",
    );
  const parent = get(next.schema, path.slice(0, -1));
  const owner = get(next.schema, path.slice(0, -2));
  const oldName = path.at(-1)!;
  const newPointer =
    edit.pointer.slice(0, edit.pointer.lastIndexOf("/") + 1) +
    escapePointer(name);
  if (edit.action === "rename" && name === oldName) return next;
  if (edit.action === "rename" && Object.hasOwn(parent, name))
    throw new Error("That name already exists.");
  visitSchema(next.schema, (schema) => {
    if (schema !== next.schema && (schema.$id || schema.id))
      throw new Error(
        "Use JSON Model to edit schemas with embedded resource identifiers.",
      );
  });
  const rewrite = (record: Record<string, any>) => {
    for (const key of ["$ref", "scope"]) {
      if (typeof record[key] !== "string" || !within(record[key], edit.pointer))
        continue;
      if (edit.action === "delete")
        throw new Error(
          "This schema is still referenced. Remove its controls, rules or references first.",
        );
      record[key] = newPointer + record[key].slice(edit.pointer.length);
    }
  };
  visitSchema(next.schema, rewrite);
  visit(next.uischema, rewrite);
  visit(next.uischemas, rewrite);
  if (keyword === "properties") {
    for (const key of [
      "dependentRequired",
      "dependentSchemas",
      "dependencies",
    ]) {
      const dependencies = owner[key];
      if (!dependencies || typeof dependencies !== "object") continue;
      if (Object.hasOwn(dependencies, oldName)) {
        if (edit.action === "rename")
          dependencies[name] = dependencies[oldName];
        delete dependencies[oldName];
      }
      for (const [dependency, values] of Object.entries(dependencies))
        if (Array.isArray(values))
          dependencies[dependency] = values.flatMap((value) =>
            value !== oldName
              ? [value]
              : edit.action === "rename"
                ? [name]
                : [],
          );
    }
  }
  if (edit.action === "rename") parent[name] = parent[oldName];
  delete parent[oldName];
  if (keyword === "properties" && Array.isArray(owner.required)) {
    owner.required = owner.required.flatMap((key: string) =>
      key !== oldName ? [key] : edit.action === "rename" ? [name] : [],
    );
    if (!owner.required.length) delete owner.required;
  }
  // Traverse actual sample instances, following local references to definitions.
  const visited = new WeakMap<object, Set<string>>();
  function updateData(schema: any, pointer: string, value: any) {
    if (
      !value ||
      typeof value !== "object" ||
      !schema ||
      typeof schema !== "object"
    )
      return;
    const seen = visited.get(value) ?? new Set<string>();
    if (seen.has(pointer)) return;
    seen.add(pointer);
    visited.set(value, seen);
    if (typeof schema.$ref === "string" && schema.$ref.startsWith("#/"))
      updateData(get(document.schema, parts(schema.$ref)), schema.$ref, value);
    for (const [key, child] of Object.entries(schema.properties ?? {}))
      updateData(
        child,
        `${pointer}/properties/${escapePointer(key)}`,
        value[key],
      );
    if (Array.isArray(value) && schema.items && !Array.isArray(schema.items))
      value.forEach((item) =>
        updateData(schema.items, `${pointer}/items`, item),
      );
    if (
      pointer ===
        edit.pointer.slice(0, edit.pointer.lastIndexOf("/properties/")) &&
      Object.hasOwn(value, oldName)
    ) {
      if (edit.action === "rename") {
        if (Object.hasOwn(value, name))
          throw new Error("Sample data already contains the new name.");
        value[name] = value[oldName];
      }
      delete value[oldName];
    }
  }
  if (keyword === "properties") updateData(document.schema, "#", next.data);
  return next;
}
