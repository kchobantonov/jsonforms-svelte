import { escapePointer, object } from "./commands/index.js";
export interface SchemaTreeNode {
  pointer: string;
  label: string;
  type: string;
  bindable: boolean;
  children: SchemaTreeNode[];
}
/** Walk schema structure, preserving container nodes rather than flattening their leaves. */
export function schemaTree(
  schema: unknown,
  pointer = "#",
  label = "(root)",
  bindable = true,
): SchemaTreeNode {
  const value = object(schema);
  const type =
    typeof schema === "boolean"
      ? schema
        ? "any"
        : "never"
      : Array.isArray(value.type)
        ? value.type.join(" | ")
        : String(
            value.type ??
              (value.properties
                ? "object"
                : value.items
                  ? "array"
                  : value.$ref
                    ? "reference"
                    : "any"),
          );
  const children = Object.entries(object(value.properties)).map(
    ([key, child]) =>
      schemaTree(
        child,
        `${pointer}/properties/${escapePointer(key)}`,
        key,
        bindable,
      ),
  );
  for (const keyword of ["$defs", "definitions"]) {
    for (const [name, definition] of Object.entries(object(value[keyword]))) {
      children.push(
        schemaTree(
          definition,
          `${pointer}/${keyword}/${escapePointer(name)}`,
          `${keyword}: ${name}`,
          false,
        ),
      );
    }
  }
  // Item fields need an array-detail editing context. Bind the whole array on this canvas.
  if (value.items !== undefined && !Array.isArray(value.items))
    children.push(schemaTree(value.items, `${pointer}/items`, "items", false));
  const tuple = Array.isArray(value.prefixItems)
    ? value.prefixItems
    : Array.isArray(value.items)
      ? value.items
      : [];
  const keyword = Array.isArray(value.prefixItems) ? "prefixItems" : "items";
  tuple.forEach((item, index) =>
    children.push(
      schemaTree(
        item,
        `${pointer}/${keyword}/${index}`,
        `${keyword}[${index}]`,
        false,
      ),
    ),
  );
  return { pointer, label, type, bindable, children };
}
export function visibleSchemaNodes(
  root: SchemaTreeNode,
  expanded: Set<string>,
): SchemaTreeNode[] {
  return [
    root,
    ...(expanded.has(root.pointer)
      ? root.children.flatMap((child) => visibleSchemaNodes(child, expanded))
      : []),
  ];
}
