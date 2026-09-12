import { elementId } from "../document/identity.js";
import {
  at,
  designRoot,
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
  const target = pathFor(designRoot(document), targetId);
  if (!target) return false;
  const parent = at(designRoot(document), target);
  if (payload.kind === "canvas-node") {
    const source = pathFor(designRoot(document), payload.elementId);
    return (
      !!source?.length &&
      !source.every((part, index) => target[index] === part) &&
      accepts(parent, at(designRoot(document), source))
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
    const source = pathFor(designRoot(document), payload.elementId)!;
    const node = clone(at(designRoot(document), source));
    next = remove(document, source);
    const target = pathFor(designRoot(next), targetId)!;
    next = insert(next, target, node);
  } else {
    const target = pathFor(designRoot(document), targetId)!;
    next =
      payload.kind === "schema-property"
        ? insert(document, target, { type: "Control", scope: payload.pointer })
        : addPreset(document, target, payload.preset);
  }
  const children = at(
    designRoot(next),
    pathFor(designRoot(next), targetId)!,
  ).elements!;
  const node = children.pop()!;
  children.splice(Math.max(0, Math.min(index, children.length)), 0, node);
  return next;
}
