import { setRule } from "../rules/model.js";
import { editSchema, type SchemaEdit } from "./schema-edit.js";
import { schemaOccurrences } from "./schema-usage.js";
import { addFormLanguage } from "../i18n/form-languages.js";
import { elementId } from "./identity.js";
import { applyDrop, canDrop, pathFor } from "../dnd/drop-handler.js";
import type { DragItem, DragPayload } from "../dnd/payloads.js";
import {
  initialize,
  clone,
  at,
  designRoot,
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
  let schemaSelection = $state<string | undefined>();
  let selected = $state<number[]>([]),
    history = $state.raw<Document[]>([]),
    future = $state.raw<Document[]>([]);
  let revision = $state(0),
    sourceLocked = $state(false),
    message = $state("");
  let previewData = $state.raw<unknown>(input.data ?? {});
  let ruleDraft = $state(false);
  const locked = $derived(sourceLocked || ruleDraft);
  let ruleFocus = $state(0);
  let dragging = $state.raw<DragItem | undefined>();
  const dragType = `editor-${crypto.randomUUID()}`;
  const target = () =>
    containers.has(at(designRoot(document), selected).type)
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
  function removeElement(id: string) {
    if (locked) return;
    attempt(() => {
      const path = pathFor(designRoot(document), id);
      if (!path?.length) return; // The root has no owning layout.
      const selectedId = elementId(at(designRoot(document), selected));
      const parentId = elementId(at(designRoot(document), path.slice(0, -1)));
      const next = remove(document, path);
      selected =
        pathFor(designRoot(next), selectedId) ??
        pathFor(designRoot(next), parentId) ??
        [];
      commit(next);
    });
  }
  return {
    get previewData() { return previewData; },
    set previewData(value: unknown) { previewData = value; },
    get ruleDraftActive() { return ruleDraft; },
    get ruleFocus() { return ruleFocus; },
    openRule(path: number[]) { if (ruleDraft) return; selected = path; schemaSelection = undefined; ruleFocus++; },
    setRuleDraft(value: boolean) { ruleDraft = value; },
    saveRule(rule: unknown) {
      const next = setRule(document, selected, rule);
      ruleDraft = false; commit(next);
    },
    editSchema(edit: SchemaEdit) {
      if (locked) throw new Error("Apply or revert the source draft first.");
      const next = editSchema(document, edit);
      schemaSelection = undefined;
      selected = [];
      commit(next);
    },
    inspectSchema(data: Parameters<typeof updateProperties>[2]) {
      const scope = schemaSelection;
      if (!scope || locked) return;
      attempt(() => {
        const temporary = clone(document);
        temporary.uischema = { type: "Control", scope };
        const next = updateProperties(temporary, [], data);
        if (document.uischema) next.uischema = clone(document.uischema);
        else delete next.uischema;
        commit(next);
      });
    },
    addLanguage(locale: string) {
      if (locked) throw new Error("Apply or revert the source draft first.");
      commit(addFormLanguage(document, locale));
    },
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
        schemaSelection = undefined;
        selected = [];
        commit(next);
      });
    },
    items(node: import("./commands/index.js").Node): DragItem[] {
      return (node.elements ?? []).map((child) => ({
        id: elementId(child),
        label: String(child.label ?? child.type),
        node: child,
        payload: { kind: "canvas-node", elementId: elementId(child) },
      }));
    },
    get layout() { return designRoot(document); },
    get document() {
      return document;
    },
    get selected() {
      return selected;
    },
    get node() {
      return at(designRoot(document), selected);
    },
    get message() {
      return message;
    },
    get locked() {
      return locked;
    },
    set locked(value: boolean) {
      sourceLocked = value;
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
          (at(designRoot(document), selected.slice(0, -1)).elements?.length ?? 0) -
            1
      );
    },
    get schemaSelection() {
      return schemaSelection;
    },
    get unplacedSchemaSelection() {
      return schemaSelection &&
        !schemaOccurrences(designRoot(document)).some(
          (item) => item.scope === schemaSelection,
        )
        ? schemaSelection
        : undefined;
    },
    selectSchema(scope: string) {
      if (ruleDraft) return;
      schemaSelection = scope;
      const matches = schemaOccurrences(designRoot(document)).filter(
        (item) => item.scope === scope,
      );
      selected =
        matches.find(
          (item) => JSON.stringify(item.path) === JSON.stringify(selected),
        )?.path ??
        matches[0]?.path ??
        [];
    },
    select(path: number[]) {
      if (ruleDraft) return;
      schemaSelection = undefined;
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
    inspect(value: { label?: string; multi?: boolean; required?: boolean }) {
      attempt(() => commit(updateProperties(document, selected, value)));
    },
    removeElement,
    remove() {
      removeElement(elementId(at(designRoot(document), selected)));
    },
    reorder(offset: number) {
      if (locked) return;
      attempt(() => {
        const next = clone(document),
          parent = at(designRoot(next), selected.slice(0, -1)),
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
      schemaSelection = undefined;
      selected = [];
      document = next;
      emit();
    },
    apply(part: string, text: string) {
      if (ruleDraft) throw new Error("Apply or revert the rule draft first.");
      const parsed = JSON.parse(text);
      const next = initialize(
        part === "model" ? parsed : { ...clone(document), [part]: parsed },
      );
      sourceLocked = false;
      schemaSelection = undefined;
      selected = [];
      commit(next);
    },
  };
}
export type EditorSession = ReturnType<typeof createSession>;
