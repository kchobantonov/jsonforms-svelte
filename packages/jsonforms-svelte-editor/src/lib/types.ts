export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };
/** Initial, host-owned JSON parts. Inputs are copied into a document session. */
export interface InitialForm {
  schema?: boolean | { [key: string]: JsonValue };
  uischema?: { [key: string]: JsonValue };
  uischemas?: JsonValue[];
  data?: JsonValue;
  config?: { [key: string]: JsonValue };
  [key: string]: JsonValue | undefined;
}
export interface DocumentChangeDetail {
  documentId: string;
  revision: number;
  document: InitialForm;
}
export interface EditorElement extends HTMLElement {
  initialForm: InitialForm;
  documentId: string;
  editorMode: "light" | "dark" | "system";
}
declare global {
  interface HTMLElementTagNameMap {
    "jsonforms-svelte-editor": EditorElement;
  }
}
