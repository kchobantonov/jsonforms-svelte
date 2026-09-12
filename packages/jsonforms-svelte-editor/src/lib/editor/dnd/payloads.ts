import type { Node } from "../document/commands/index.js";
export type DragPayload =
  | { kind: "canvas-node"; elementId: string }
  | { kind: "schema-property"; pointer: string }
  | { kind: "palette-item"; preset: string };
export type DragItem = {
  id: string;
  label: string;
  payload: DragPayload;
  node?: Node;
  isDndShadowItem?: boolean;
};
