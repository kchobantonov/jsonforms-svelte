import type { InitialForm } from "@chobantonov/jsonforms-svelte-editor";
export type {
  InitialForm,
  DocumentChangeDetail,
} from "@chobantonov/jsonforms-svelte-editor";
export interface EditorElement extends HTMLElement {
  undo(): void;
  redo(): void;
  editorLocale: string;
  formLocale: string;
  editorMessages: import("@chobantonov/jsonforms-svelte-editor").EditorMessages;
  initialForm: InitialForm;
  documentId: string;
  editorMode: "light" | "dark" | "system";
}
declare global {
  interface HTMLElementTagNameMap {
    "jsonforms-svelte-editor": EditorElement;
  }
}
