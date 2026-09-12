<script lang="ts">
  import SourceDocumentSelect from "./shared/SourceDocumentSelect.svelte";
  import IconAction from "./shared/IconAction.svelte";
  import Check from "@lucide/svelte/icons/check";
  import Undo2 from "@lucide/svelte/icons/undo-2";
  import { useEditorI18n } from "../i18n/context.js";
  const i18n = useEditorI18n();
  import { sourceSchema } from "../monaco/schemas.js";
  import type { Component } from "svelte";
  import type { EditorSession } from "../document/history-store.svelte.js";
  let {
    session,
    mode,
    visible,
    ondraft,
  }: {
    session: EditorSession;
    mode: string;
    visible: boolean;
    ondraft: (dirty: boolean) => void;
  } = $props();
  let Source = $state<
    | Component<{
        value: string;
        sync?: boolean;
        schema: Record<string, unknown>;
        mode: string;
        onchange: (value: string) => void;
      }>
    | undefined
  >();
  let part = $state("model"),
    text = $state(""),
    dirty = $state(false),
    error = $state("");
  const value = $derived(
    part === "model"
      ? session.document
      : (session.document[part] ?? (part === "uischemas" ? [] : {})),
  );
  $effect(() => {
    session.locked = dirty;
    ondraft(dirty);
  });
  $effect(() => {
    if (visible && !Source)
      import("./MonacoPane.svelte")
        .then((module) => (Source = module.default))
        .catch((reason) => (error = String(reason)));
  });
  function apply() {
    try {
      session.apply(part, text);
      dirty = false;
      error = "";
    } catch (reason) {
      error = reason instanceof Error ? reason.message : String(reason);
    }
  }
</script>

<section
  class="model-source"
  aria-label={i18n.t("Model source")}
  hidden={!visible}
>
  <h2>{i18n.t("Source")}</h2>
  <div class="source-document-field">
    <span>{i18n.t("Document")}</span><SourceDocumentSelect
      bind:value={part}
      disabled={dirty}
    />
    <IconAction label={i18n.t("Apply")} disabled={!dirty} onclick={apply}
      ><Check size={16} /></IconAction
    >
    <IconAction
      label={i18n.t("Revert")}
      disabled={!dirty}
      onclick={() => {
        dirty = false;
        error = "";
      }}><Undo2 size={16} /></IconAction
    >
  </div>
  {#if Source}<Source
      sync={!dirty}
      value={dirty ? text : JSON.stringify(value, null, 2)}
      schema={sourceSchema(part, session.document)}
      {mode}
      onchange={(value) => {
        text = value;
        dirty = true;
      }}
    />{:else}<p>{i18n.t("Loading Monaco…")}</p>{/if}{#if error}<p role="alert">
      {error}
    </p>{/if}
</section>
