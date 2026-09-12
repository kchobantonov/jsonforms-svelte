import DemoToolbar from "./DemoToolbar.svelte";
import "@chobantonov/jsonforms-svelte-editor/styles.css";
import { mount, unmount, flushSync } from "svelte";
import NativeHost from "./NativeHost.svelte";
import type { InitialForm } from "@chobantonov/jsonforms-svelte-editor";
import type { EditorElement } from "@chobantonov/jsonforms-svelte-editor-webcomponent";
import "./style.css";
const resources = import.meta.glob(
  "../../../packages/jsonforms-svelte-demo-common/src/lib/examples/*/*.json",
  { eager: true, import: "default" },
) as Record<string, unknown>;
const examples = new Map<string, InitialForm>();
for (const [path, value] of Object.entries(resources)) {
  const match = path.match(
    /examples\/([^/]+)\/(schema|uischema|uischemas|data|i18n)\.json$/,
  );
  if (!match) continue;
  const [, name, part] = match;
  const form = examples.get(name) ?? {};
  form[part === "i18n" ? "translations" : part] = value as InitialForm["data"];
  examples.set(name, form);
}
await import(
  /* @vite-ignore */ new URL(
    `${import.meta.env.BASE_URL}editor/jsonforms-svelte-editor.js`,
    document.baseURI,
  ).href
);
await customElements.whenDefined("jsonforms-svelte-editor");
const toolbar = flushSync(() =>
  mount(DemoToolbar, {
    target: document.querySelector("#demo-toolbar")!,
    props: {
      examples: [...examples]
        .filter(([, form]) => form.schema && form.uischema)
        .map(([name]) => name),
    },
  }),
);
const select = document.querySelector<HTMLSelectElement>("#example")!;
let dirty = false;
let draft = false;
let current = "new";
let editor: EditorElement | undefined;
let native:
  | {
      setLocales: (ui: string) => void;
      setMode: (mode: "light" | "dark" | "system") => void;
      undo: () => void;
      redo: () => void;
    }
  | undefined;
const integration = document.querySelector<HTMLSelectElement>("#integration")!;
function load(name: string) {
  toolbar.setHistory({ canUndo: false, canRedo: false });
  if (native) {
    void unmount(native);
    native = undefined;
  }
  const host = document.querySelector("#editor-host")!;
  host.replaceChildren();
  if (integration.value === "native") {
    editor = undefined;
    native = mount(NativeHost, {
      target: host,
      props: {
        documentId: name === "new" ? "New form" : name,
        ...(examples.has(name)
          ? { initialForm: structuredClone(examples.get(name)!) }
          : {}),
        editorMode: document.querySelector<HTMLSelectElement>("#mode")!
          .value as EditorElement["editorMode"],
        onchange: (document, revision) => {
          dirty = true;
          host.dispatchEvent(
            new CustomEvent("document-change", {
              detail: {
                documentId: name === "new" ? "New form" : name,
                document,
                revision,
              },
              bubbles: true,
            }),
          );
        },
        editorLocale:
          document.querySelector<HTMLSelectElement>("#editor-locale")!.value,

        onhistory: (state) => toolbar.setHistory(state),
        ondraft: (value) => {
          draft = value;
        },
      },
    });
  } else {
    editor = document.createElement("jsonforms-svelte-editor");
    editor.editorLocale =
      document.querySelector<HTMLSelectElement>("#editor-locale")!.value;

    editor.documentId = name === "new" ? "New form" : name;
    if (examples.has(name))
      editor.initialForm = structuredClone(examples.get(name)!);
    editor.editorMode = document.querySelector<HTMLSelectElement>("#mode")!
      .value as EditorElement["editorMode"];
    editor.addEventListener("history-change", (event) =>
      toolbar.setHistory((event as CustomEvent).detail),
    );
    editor.addEventListener("document-change", () => (dirty = true));
    editor.addEventListener(
      "draft-change",
      (event) => (draft = (event as CustomEvent).detail.dirty),
    );
    document.querySelector("#editor-host")!.replaceChildren(editor);
  }
  dirty = false;
  draft = false;
  current = name;
  select.value = name;
}
load("new");
let pending = false;
async function requestLoad(name: string, nextIntegration = currentIntegration) {
  if (pending) return;
  pending = true;
  try {
    if (
      (dirty || draft) &&
      !(await toolbar.confirmDiscard(
        name === "new"
          ? "Your edits will be discarded and a blank form will open."
          : "Your edits will be discarded before switching forms or integration.",
      ))
    )
      return;
    integration.value = nextIntegration;
    currentIntegration = nextIntegration;
    load(name);
  } finally {
    integration.value = currentIntegration;
    select.value = current;
    pending = false;
  }
}
document.querySelector("#new-form")!.addEventListener("click", () => {
  void requestLoad("new");
});
select.addEventListener("change", () => {
  const name = select.value;
  select.value = current;
  void requestLoad(name);
});
document
  .querySelector<HTMLSelectElement>("#mode")!
  .addEventListener("change", (event) => {
    const mode = (event.target as HTMLSelectElement)
      .value as EditorElement["editorMode"];
    document.querySelector(".demo-toolbar")?.setAttribute("data-mode", mode);
    if (editor) editor.editorMode = mode;
    else native?.setMode(mode);
  });
window.addEventListener("beforeunload", (event) => {
  if (dirty || draft) {
    event.preventDefault();
    event.returnValue = "";
  }
});

let currentIntegration = integration.value;
integration.addEventListener("change", () => {
  const next = integration.value;
  integration.value = currentIntegration;
  void requestLoad(current, next);
});

document
  .querySelector("#undo")!
  .addEventListener("click", () => (editor ?? native)?.undo());
document
  .querySelector("#redo")!
  .addEventListener("click", () => (editor ?? native)?.redo());

for (const id of ["editor-locale"])
  document.querySelector(`#${id}`)!.addEventListener("change", () => {
    const ui =
      document.querySelector<HTMLSelectElement>("#editor-locale")!.value;

    if (editor) {
      editor.editorLocale = ui;
    } else native?.setLocales(ui);
  });
