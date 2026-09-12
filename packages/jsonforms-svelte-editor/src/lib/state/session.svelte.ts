import {
  initialize,
  clone,
  at,
  containers,
  insert,
  remove,
  move,
  addPreset,
  updateProperties,
  type Document,
} from "../document/commands.js";
import type { InitialForm } from "../types.js";
/** Owns a document session; UI components invoke actions and read its state. */
export function createSession(
  input: InitialForm,
  onchange: (document: Document, revision: number) => void,
) {
  let document = $state(initialize(input));
  let selected = $state<number[]>([]),
    history = $state<Document[]>([]),
    future = $state<Document[]>([]);
  let revision = $state(0),
    locked = $state(false),
    message = $state("");
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
    drop(event: DragEvent, path: number[]) {
      if (locked) return;
      attempt(() => {
        const payload = JSON.parse(
          event.dataTransfer?.getData("application/json") ?? "",
        );
        if (payload.kind === "move") {
          const next = move(document, payload.path, path);
          selected = [];
          commit(next);
        } else if (payload.kind === "field")
          commit(
            insert(document, path, { type: "Control", scope: payload.scope }),
          );
        else if (payload.kind === "preset")
          commit(addPreset(document, path, payload.preset));
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
