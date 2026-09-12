import type { Node } from "./commands/index.js";
import type { SchemaTreeNode } from "./schema-tree.js";
export interface SchemaOccurrence {
  path: number[];
  label: string;
  scope: string;
}
/** Only the active UI schema's actual controls count as placed fields. */
export function schemaOccurrences(root: Node | undefined): SchemaOccurrence[] {
  const result: SchemaOccurrence[] = [];
  function visit(node: Node, path: number[], trail: string[]) {
    const label = `${String(node.label || node.type)}${path.length ? ` [${path.at(-1)! + 1}]` : ""}`;
    const next = [...trail, label];
    if (node.type === "Control" && typeof node.scope === "string")
      result.push({ path, label: next.join(" / "), scope: node.scope });
    node.elements?.forEach((child, index) =>
      visit(child, [...path, index], next),
    );
  }
  if (root) visit(root, [], []);
  return result;
}
/** Keep used ancestors as non-draggable context when they contain unused descendants. */
export function unusedSchemaTree(
  root: SchemaTreeNode,
  used: Set<string>,
): SchemaTreeNode | undefined {
  const children = root.children.flatMap((child) => {
    const filtered = unusedSchemaTree(child, used);
    return filtered ? [filtered] : [];
  });
  const available = root.bindable && !used.has(root.pointer);
  if (!available && !children.length) return undefined;
  return { ...root, bindable: available, children };
}
