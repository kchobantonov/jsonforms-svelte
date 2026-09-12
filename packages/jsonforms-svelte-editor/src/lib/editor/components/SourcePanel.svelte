<script lang="ts">
  import Button from "@jsonforms-svelte-shadcn-ui/button/button.svelte";
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

<section aria-label="Model source" hidden={!visible}>
  <h2>Source</h2>
  <label
    >Document <select
      aria-label="Source document"
      disabled={dirty}
      bind:value={part}
      >{#each ["model", "schema", "uischema", "uischemas", "data", "config", "translations"] as name}<option
          value={name}>{name}</option
        >{/each}</select
    ></label
  >{#if Source}<Source
      sync={!dirty}
      value={dirty ? text : JSON.stringify(value, null, 2)}
      schema={sourceSchema(part, session.document)}
      {mode}
      onchange={(value) => {
        text = value;
        dirty = true;
      }}
    />{:else}<p>Loading Monaco…</p>{/if}{#if error}<p role="alert">
      {error}
    </p>{/if}<Button onclick={apply} disabled={!dirty}>Apply</Button><Button
    variant="outline"
    disabled={!dirty}
    onclick={() => {
      dirty = false;
      error = "";
    }}>Revert</Button
  >
</section>
