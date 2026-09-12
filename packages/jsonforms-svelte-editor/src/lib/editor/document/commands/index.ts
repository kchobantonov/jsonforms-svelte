import { applyChoiceProperties } from "../../inspector/choices.js";
import { applyTranslations } from "../../inspector/translations.js";
import { schemaFields, optionFields } from "../../inspector/fields.js";
import { transferIdentities } from "../identity.js";
import type { InitialForm, JsonValue } from "../types.js";
export type ObjectValue = { [key: string]: JsonValue };
export type Node = ObjectValue & { type: string; elements?: Node[] };
export type Document = InitialForm & { uischema?: Node };
const emptyRoots = new WeakMap<Document, Node>();
/** A transient drop target; never serialized until a visual element is inserted. */
export function designRoot(document: Document): Node {
  if (document.uischema) return document.uischema;
  let root = emptyRoots.get(document);
  if (!root) {
    root = { type: "VerticalLayout", elements: [] };
    emptyRoots.set(document, root);
  }
  return root;
}
export const clone = <T>(value: T): T => {
  const copy = JSON.parse(JSON.stringify(value));
  transferIdentities(value, copy);
  return copy;
};
export const object = (value: unknown): ObjectValue =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as ObjectValue)
    : {};
export const escapePointer = (value: string) =>
  value.replace(/~/g, "~0").replace(/\//g, "~1");
export function resolve(schema: unknown, scope: unknown): ObjectValue {
  if (typeof scope !== "string" || !scope.startsWith("#/")) return {};
  try {
    return object(
      decodeURIComponent(scope.slice(2))
        .split("/")
        .reduce<unknown>(
          (value, part) =>
            object(value)[part.replace(/~1/g, "/").replace(/~0/g, "~")],
          schema,
        ),
    );
  } catch {
    return {};
  }
}
export function fields(
  schema: unknown,
  prefix = "#",
): { name: string; scope: string }[] {
  return Object.entries(object(object(schema).properties)).flatMap(
    ([name, value]) => {
      const scope = `${prefix}/properties/${escapePointer(name)}`;
      return [{ name, scope }, ...fields(value, scope)];
    },
  );
}
export function initialize(input: InitialForm): Document {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("The form model must be an object.");
  if (
    input.schema !== undefined &&
    typeof input.schema !== "boolean" &&
    (input.schema === null ||
      typeof input.schema !== "object" ||
      Array.isArray(input.schema))
  )
    throw new Error("Schema must be an object or boolean.");
  function validateNode(value: unknown): void {
    const n = object(value);
    if (typeof n.type !== "string")
      throw new Error("Every UI element needs a type.");
    if (n.elements !== undefined) {
      if (!Array.isArray(n.elements))
        throw new Error("Layout elements must be an array.");
      n.elements.forEach(validateNode);
    }
  }
  if (input.uischema !== undefined) validateNode(input.uischema);
  const doc = clone(input);
  doc.schema ??= { type: "object", properties: {} };
  return doc as Document;
}
export function at(root: Node, path: number[]): Node {
  return path.reduce((node, index) => {
    const child = node.elements?.[index];
    if (!child) throw new Error("The selected element no longer exists.");
    return child;
  }, root);
}
export const containers = new Set([
  "VerticalLayout",
  "HorizontalLayout",
  "Group",
  "Category",
  "Categorization",
]);
export function accepts(parent: Node, child: Node) {
  return (
    containers.has(parent.type) &&
    (parent.type === "Categorization"
      ? child.type === "Category"
      : child.type !== "Category")
  );
}
export function insert(
  doc: Document,
  parentPath: number[],
  node: Node,
): Document {
  const next = clone(doc);
  next.uischema ??= clone(designRoot(doc));
  const parent = at(designRoot(next), parentPath);
  if (!accepts(parent, node))
    throw new Error(
      "Choose a compatible layout. Categories belong inside a categorization.",
    );
  (parent.elements ??= []).push(clone(node));
  return next;
}
export function remove(doc: Document, path: number[]): Document {
  if (!path.length) throw new Error("The root layout cannot be removed.");
  const next = clone(doc);
  at(designRoot(next), path.slice(0, -1)).elements!.splice(path.at(-1)!, 1);
  return next;
}
export function move(
  doc: Document,
  source: number[],
  target: number[],
): Document {
  if (!source.length || source.every((part, index) => target[index] === part))
    throw new Error("An element cannot move into itself or its descendants.");
  const node = at(designRoot(doc), source);
  if (!accepts(at(designRoot(doc), target), node))
    throw new Error("Choose a compatible layout.");
  const adjusted = [...target],
    parent = source.slice(0, -1),
    index = source.at(-1)!;
  if (
    parent.every((part, i) => target[i] === part) &&
    target.length > parent.length &&
    target[parent.length] > index
  )
    adjusted[parent.length]!--;
  return insert(remove(doc, source), adjusted, node);
}
export function addPreset(
  doc: Document,
  target: number[],
  preset: string,
): Document {
  if (preset === "Image View") preset = "ImageView";
  if (["Separator", "Spacer", "ImageView"].includes(preset))
    return insert(doc, target, { type: preset, ...(preset === "Spacer" ? { options: { height: 32 } } : preset === "ImageView" ? { options: { src: "", alt: "" } } : {}) });
  if (preset === "Label")
    return insert(doc, target, { type: "Label", text: "Text" });
  if (preset === "Button")
    return insert(doc, target, {
      type: "Button",
      label: "Button",
      action: "submit",
    });
  if (containers.has(preset))
    return insert(doc, target, {
      type: preset,
      ...(["Group", "Category"].includes(preset) ? { label: preset } : {}),
      elements:
        preset === "Categorization"
          ? [{ type: "Category", label: "New tab", elements: [] }]
          : [],
    });
  if (object(doc.schema).type !== "object")
    throw new Error("New fields currently require a root object schema.");
  const next = clone(doc),
    schema = object(next.schema),
    properties = object(schema.properties);
  next.uischema ??= clone(designRoot(doc));
  const base =
    preset === "textarea"
      ? "notes"
      : preset === "number"
        ? "number"
        : preset === "checkbox"
          ? "enabled"
          : "text";
  let key = base,
    index = 2;
  while (key in properties) key = `${base}${index++}`;
  properties[key] = {
    type:
      preset === "number"
        ? "number"
        : preset === "checkbox"
          ? "boolean"
          : "string",
  };
  if (["Select", "Radio group", "Checkbox group"].includes(preset)) {
    const choices = { type: "string", enum: ["Option 1", "Option 2"] };
    properties[key] = preset === "Checkbox group" ? { type: "array", uniqueItems: true, items: choices } : choices;
  }
  schema.properties = properties;
  return insert(next, target, {
    type: "Control",
    scope: `#/properties/${escapePointer(key)}`,
    ...(preset === "textarea" ? { options: { multi: true } } : preset === "Radio group" ? { options: { format: "radio" } } : {}),
  });
}
export function updateProperties(
  doc: Document,
  path: number[],
  data: {
    label?: string;
    multi?: boolean;
    required?: boolean;
    action?: string;
    [key: string]: unknown;
  },
): Document {
  const next = clone(doc),
    node = at(designRoot(next), path);
  const schema =
    node.scope === "#" ? object(next.schema) : resolve(next.schema, node.scope);
  if (node.type === "Control" && "schemaTypes" in data) {
    const types = data.schemaTypes;
    if (types === undefined) delete schema.type;
    else {
      if (!Array.isArray(types) || !types.length || types.some((type) => !["string", "number", "integer", "boolean", "object", "array", "null"].includes(type)))
        throw new Error("Choose at least one schema type.");
      const unique = [...new Set(types)];
      schema.type = unique.length === 1 ? unique[0] : unique;
      if (!unique.includes("string")) {
        const options = object(node.options);
        delete options.multi;
      }
    }
  }
  if (node.type === "Control")
    for (const [key, keyword] of Object.entries(schemaFields)) {
      if (!(key in data)) continue;
      if (data[key] === undefined) delete schema[keyword];
      else schema[keyword] = data[key] as JsonValue;
    }
  for (const key of optionFields) {
    if (!(key in data)) continue;
    if (node.type !== "Group" && key !== "readonly") continue;
    if (node.type !== "Control" && key === "readonly") continue;
    const options = object(node.options);
    if (data[key] === undefined) delete options[key];
    else options[key] = data[key] as JsonValue;
    if (Object.keys(options).length) node.options = options;
    else delete node.options;
  }
  applyChoiceProperties(schema, node, data);
  const presentationKeys = node.type === "Spacer" ? ["height"] : node.type === "ImageView" ? ["src", "alt"] : [];
  for (const key of presentationKeys) if (key in data) {
    const options = object(node.options);
    if (data[key] === undefined) delete options[key];
    else options[key] = data[key] as JsonValue;
    node.options = options;
  }
  applyTranslations(next, node, data);
  const labelKey = node.type === "Label" ? "text" : "label";
  if (
    ["Control", "Group", "Category", "Label", "Button"].includes(node.type) &&
    "label" in data
  ) {
    if (data.label === undefined) delete node[labelKey];
    else node[labelKey] = data.label;
  }
  if (node.type === "Button" && data.action !== undefined)
    node.action = data.action;
  if (node.type === "Control") {
    const options = object(node.options);
    if (
      (schema.type === "string" ||
        (Array.isArray(schema.type) && schema.type.includes("string"))) &&
      "multi" in data
    ) {
      if (data.multi === undefined) delete options.multi;
      else options.multi = data.multi;
      if (Object.keys(options).length) node.options = options;
      else delete node.options;
    }
    const scope = String(node.scope ?? ""),
      parts = scope.split("/"),
      encoded = parts.at(-1)!;
    const parent = resolve(next.schema, parts.slice(0, -2).join("/") || "#");
    const owner = parts.length === 3 ? object(next.schema) : parent;
    const name = encoded.replace(/~1/g, "/").replace(/~0/g, "~");
    if ("required" in data && parts.at(-2) === "properties" && name in object(owner.properties)) {
      const required = Array.isArray(owner.required) ? owner.required : [];
      if (data.required && !required.includes(name))
        owner.required = [...required, name];
      if (!data.required && required.includes(name))
        owner.required = required.filter((key) => key !== name);
    }
  }
  return next;
}
export function properties(doc: Document, node: Node) {
  const scope = String(node.scope ?? ""),
    parts = scope.split("/");
  const owner =
    parts.length === 3
      ? object(doc.schema)
      : resolve(doc.schema, parts.slice(0, -2).join("/"));
  return {
    label: String((node.type === "Label" ? node.text : node.label) ?? ""),
    ...(node.type === "Button" ? { action: String(node.action ?? "") } : {}),
    multi: Boolean(object(node.options).multi),
    required:
      Array.isArray(owner.required) &&
      owner.required.includes(
        parts.at(-1)!.replace(/~1/g, "/").replace(/~0/g, "~"),
      ),
  };
}
/** Script-bearing repository extensions require a separate trusted preview policy. */
export function previewSafe(value: unknown): boolean {
  if (Array.isArray(value)) return value.every(previewSafe);
  if (value && typeof value === "object")
    return Object.entries(value).every(
      ([key, item]) =>
        !(
          ["tester", "validate", "template"].includes(key) &&
          typeof item === "string"
        ) && previewSafe(item),
    );
  return true;
}

export function hasScope(schema: unknown, scope: unknown): boolean {
  if (scope === "#") return schema !== undefined;
  if (typeof scope !== "string" || !scope.startsWith("#/")) return false;
  try {
    let value: unknown = schema;
    for (const part of decodeURIComponent(scope.slice(2)).split("/")) {
      const key = part.replace(/~1/g, "/").replace(/~0/g, "~");
      const record = object(value);
      if (!Object.hasOwn(record, key)) return false;
      value = record[key];
    }
    return value !== undefined;
  } catch {
    return false;
  }
}
export function brokenScopes(document: Document): string[] {
  const result: string[] = [];
  function visit(node: Node) {
    if (node.type === "Control" && !hasScope(document.schema, node.scope))
      result.push(String(node.scope));
    node.elements?.forEach(visit);
  }
  if (document.uischema) visit(document.uischema);
  return result;
}
