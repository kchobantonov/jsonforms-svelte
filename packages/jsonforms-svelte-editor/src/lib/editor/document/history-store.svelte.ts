import { elementId } from "./identity.js";
import { applyDrop, canDrop } from "../dnd/drop-handler.js";
import type { DragItem, DragPayload } from "../dnd/payloads.js";
import {
  initialize,
  clone,
  at,
  containers,
  insert,
  remove,
  addPreset,
  updateProperties,
  type Document,
} from "./commands/index.js";
import type { InitialForm } from "./types.js";
/** Owns a document session; UI components invoke actions and read its state. */
export function createSession(
  input: InitialForm,
  onchange: (document: Document, revision: number) => void,
) {
  let document = $state.raw(initialize(input));
  let selected = $state<number[]>([]),
    history = $state.raw<Document[]>([]),
    future = $state.raw<Document[]>([]);
  let revision = $state(0),
    locked = $state(false),
    message = $state("");
  let dragging = $state.raw<DragItem | undefined>();
  const dragType = `editor-${crypto.randomUUID()}`;
  const target = () =>
    containers.has(at(document.uischema, selected).type)
      ? selected
      : selected.slice(0, -1);
  function attempt(action: () => void) {
    try {
      action();
      message = "";
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
  }
  function emit() {
    onchange(clone(document), ++revision);
  }
  function commit(next: Document) {
    if (locked) return;
    if (JSON.stringify(next) === JSON.stringify(document)) return;
    history = [...history, clone(document)];
    future = [];
    document = next;
    emit();
  }
  return {
    dragType,
    get dragging() {
      return dragging;
    },
    set dragging(value: DragItem | undefined) {
      dragging = value;
    },
    get revision() {
      return revision;
    },
    canDrop(payload: DragPayload, targetId: string) {
      return !locked && canDrop(document, payload, targetId);
    },
    finalizeDrop(payload: DragPayload, targetId: string, index: number) {
      if (locked) return;
      attempt(() => {
        const next = applyDrop(document, payload, targetId, index);
        selected = [];
        commit(next);
      });
    },
    items(node: Document["uischema"]): DragItem[] {
      return (node.elements ?? []).map((child) => ({
        id: elementId(child),
        label: String(child.label ?? child.type),
        node: child,
        payload: { kind: "canvas-node", elementId: elementId(child) },
      }));
    },
    get document() {
      return document;
    },
    get selected() {
      return selected;
    },
    get node() {
      return at(document.uischema, selected);
    },
    get message() {
      return message;
    },
    get locked() {
      return locked;
    },
    set locked(value: boolean) {
      locked = value;
    },
    get canUndo() {
      return !locked && history.length > 0;
    },
    get canRedo() {
      return !locked && future.length > 0;
    },
    get canMoveUp() {
      return !locked && selected.length > 0 && selected.at(-1)! > 0;
    },
    get canMoveDown() {
      return (
        !locked &&
        selected.length > 0 &&
        selected.at(-1)! <
          (at(document.uischema, selected.slice(0, -1)).elements?.length ?? 0) -
            1
      );
    },
    select(path: number[]) {
      selected = path;
    },
    add(preset: string) {
      attempt(() => commit(addPreset(document, target(), preset)));
    },
    bind(scope: string) {
      attempt(() =>
        commit(insert(document, target(), { type: "Control", scope })),
      );
    },
    inspect(value: { label: string; multi: boolean; required: boolean }) {
      attempt(() => commit(updateProperties(document, selected, value)));
    },
    remove() {
      if (locked) return;
      attempt(() => {
        const next = remove(document, selected);
        selected = selected.slice(0, -1);
        commit(next);
      });
    },
    reorder(offset: number) {
      if (locked) return;
      attempt(() => {
        const next = clone(document),
          parent = at(next.uischema, selected.slice(0, -1)),
          index = selected.at(-1)!;
        const destination = index + offset;
        if (destination < 0 || destination >= (parent.elements?.length ?? 0))
          return;
        const [item] = parent.elements!.splice(index, 1);
        parent.elements!.splice(destination, 0, item);
        selected = [...selected.slice(0, -1), destination];
        commit(next);
      });
    },
    undo(redo = false) {
      if (locked) return;
      const stack = redo ? future : history;
      if (!stack.length) return;
      const next = stack.at(-1)!;
      if (redo) {
        future = future.slice(0, -1);
        history = [...history, clone(document)];
      } else {
        history = history.slice(0, -1);
        future = [...future, clone(document)];
      }
      selected = [];
      document = next;
      emit();
    },
    apply(part: string, text: string) {
      const parsed = JSON.parse(text);
      const next = initialize(
        part === "model" ? parsed : { ...clone(document), [part]: parsed },
      );
      locked = false;
      selected = [];
      commit(next);
    },
  };
}
export type EditorSession = ReturnType<typeof createSession>;
