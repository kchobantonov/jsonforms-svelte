import { elementId } from "../document/identity.js";
import {
  at,
  clone,
  accepts,
  insert,
  remove,
  addPreset,
  type Document,
  type Node,
} from "../document/commands/index.js";
import type { DragPayload } from "./payloads.js";
export function pathFor(
  root: Node,
  id: string,
  path: number[] = [],
): number[] | undefined {
  if (elementId(root) === id) return path;
  for (const [index, child] of (root.elements ?? []).entries()) {
    const found = pathFor(child, id, [...path, index]);
    if (found) return found;
  }
  return undefined;
}
export function canDrop(
  document: Document,
  payload: DragPayload,
  targetId: string,
): boolean {
  const target = pathFor(document.uischema, targetId);
  if (!target) return false;
  const parent = at(document.uischema, target);
  if (payload.kind === "canvas-node") {
    const source = pathFor(document.uischema, payload.elementId);
    return (
      !!source?.length &&
      !source.every((part, index) => target[index] === part) &&
      accepts(parent, at(document.uischema, source))
    );
  }
  return accepts(parent, {
    type:
      payload.kind === "palette-item" &&
      [
        "VerticalLayout",
        "HorizontalLayout",
        "Group",
        "Categorization",
        "Category",
      ].includes(payload.preset)
        ? payload.preset
        : "Control",
  });
}
/** Only a final drop reaches this command; hover lists never modify the document. */
export function applyDrop(
  document: Document,
  payload: DragPayload,
  targetId: string,
  index: number,
): Document {
  if (!canDrop(document, payload, targetId))
    throw new Error(
      "Choose a compatible container outside the dragged element.",
    );
  let next: Document;
  if (payload.kind === "canvas-node") {
    const source = pathFor(document.uischema, payload.elementId)!;
    const node = clone(at(document.uischema, source));
    next = remove(document, source);
    const target = pathFor(next.uischema, targetId)!;
    next = insert(next, target, node);
  } else {
    const target = pathFor(document.uischema, targetId)!;
    next =
      payload.kind === "schema-property"
        ? insert(document, target, { type: "Control", scope: payload.pointer })
        : addPreset(document, target, payload.preset);
  }
  const children = at(
    next.uischema,
    pathFor(next.uischema, targetId)!,
  ).elements!;
  const node = children.pop()!;
  children.splice(Math.max(0, Math.min(index, children.length)), 0, node);
  return next;
}
