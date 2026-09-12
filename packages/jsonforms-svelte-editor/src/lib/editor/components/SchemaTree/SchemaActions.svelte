<script lang="ts">
  import IconAction from "../shared/IconAction.svelte";
  import Plus from "@lucide/svelte/icons/plus";
  import FilePlus from "@lucide/svelte/icons/file-plus";
  import Pencil from "@lucide/svelte/icons/pencil";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import * as Dialog from "@jsonforms-svelte-shadcn-ui/dialog/index.js";
  import * as Select from "@jsonforms-svelte-shadcn-ui/select/index.js";
  import Button from "@jsonforms-svelte-shadcn-ui/button/button.svelte";
  import Input from "@jsonforms-svelte-shadcn-ui/input/input.svelte";
  import Label from "@jsonforms-svelte-shadcn-ui/label/label.svelte";
  import { getContext } from "svelte";
  import { editorPortalTarget } from "../../portal-context.js";
  import { useEditorI18n } from "../../i18n/context.js";
  import {
    definitionPointers,
    type SchemaEdit,
  } from "../../document/schema-edit.js";
  import type { SchemaTreeNode } from "../../document/schema-tree.js";
  import type { EditorSession } from "../../document/history-store.svelte.js";
  let { node, session }: { node: SchemaTreeNode; session: EditorSession } =
    $props();
  const i18n = useEditorI18n();
  const target = getContext<() => HTMLElement | undefined>(editorPortalTarget);
  const id = $props.id();
  let open = $state(false),
    action = $state<SchemaEdit["action"]>("add"),
    name = $state(""),
    type = $state("string"),
    error = $state("");
  let additionalTypes = $state<string[]>([]);
  let itemType = $state("object");
  const titles = {
    add: "Add property",
    definition: "Add definition",
    rename: "Rename",
    delete: "Delete",
  };
  const editable = $derived(
    /\/(properties|\$defs|definitions)\/[^/]+$/.test(node.pointer),
  );
  const choices = $derived([
    "string",
    "number",
    "integer",
    "boolean",
    "object",
    "array",
    "null",
    ...definitionPointers(session.document.schema),
  ]);
  function start(next: SchemaEdit["action"]) {
    action = next;
    name =
      next === "rename"
        ? node.pointer
            .split("/")
            .at(-1)!
            .replace(/~1/g, "/")
            .replace(/~0/g, "~")
        : "";
    type = next === "definition" ? "object" : "string";
    additionalTypes = [];
    itemType = "object";
    error = "";
    open = true;
  }
  function submit(event: SubmitEvent) {
    event.preventDefault();
    try {
      session.editSchema({
        action,
        pointer: node.pointer,
        name,
        type: type.startsWith("#/") ? type : [type, ...additionalTypes],
        itemType,
      });
      open = false;
    } catch (reason) {
      error = i18n.t(reason instanceof Error ? reason.message : String(reason));
    }
  }
</script>

<div class="schema-actions">
  {#if node.type.split(" | ").includes("object")}
    <IconAction
      label={`${i18n.t("Add property")} ${node.label}`}
      disabled={session.locked}
      onclick={() => start("add")}><Plus size={16} /></IconAction
    >
  {/if}
  {#if node.pointer === "#"}
    <IconAction
      label={i18n.t("Add definition")}
      disabled={session.locked}
      onclick={() => start("definition")}><FilePlus size={16} /></IconAction
    >
  {/if}
  {#if editable}
    <IconAction
      label={`${i18n.t("Rename")} ${node.label}`}
      disabled={session.locked}
      onclick={() => start("rename")}><Pencil size={16} /></IconAction
    >
    <IconAction
      label={`${i18n.t("Delete")} ${node.label}`}
      disabled={session.locked}
      onclick={() => start("delete")}><Trash2 size={16} /></IconAction
    >
  {/if}
</div>
<Dialog.Root bind:open>
  <Dialog.Content portalProps={{ to: target?.() }}>
    <Dialog.Header
      ><Dialog.Title>{i18n.t(titles[action])}</Dialog.Title><Dialog.Description
        >{action === "delete"
          ? i18n.t(
              "Delete this schema and its sample data? Referenced schemas cannot be deleted.",
            )
          : i18n.t(
              "Edit the schema structure. Arrays start with object items; expand items to add their properties.",
            )}</Dialog.Description
      ></Dialog.Header
    >
    <form class="editor-dialog-form" onsubmit={submit}>
      {#if action !== "delete"}<div class="editor-dialog-field">
          <Label for={id}>{i18n.t("Name")}</Label><Input
            {id}
            bind:value={name}
            required
          />
        </div>{/if}
      {#if action === "add" || action === "definition"}
        <div class="editor-dialog-field">
          <Label for={`${id}-type`}>{i18n.t("Schema type or definition")}</Label
          >
          <Select.Root type="single" bind:value={type}>
            <Select.Trigger
              id={`${id}-type`}
              aria-label={i18n.t("Schema type or definition")}
              >{type}</Select.Trigger
            >
            <Select.Content portalProps={{ disabled: true }}
              >{#each choices as choice}<Select.Item
                  value={choice}
                  label={choice}>{choice}</Select.Item
                >{/each}</Select.Content
            >
          </Select.Root>
        </div>
      {/if}
      {#if (action === "add" || action === "definition") && !type.startsWith("#/")}
        <div class="editor-dialog-field">
          <Label for={`${id}-additional-types`}
            >{i18n.t("Additional types")}</Label
          >
          <Select.Root type="multiple" bind:value={additionalTypes}>
            <Select.Trigger
              id={`${id}-additional-types`}
              aria-label={i18n.t("Additional types")}
              >{additionalTypes.join(", ") || i18n.t("None")}</Select.Trigger
            >
            <Select.Content portalProps={{ disabled: true }}>
              {#each choices.filter((choice) => !choice.startsWith("#/") && choice !== type) as choice}
                <Select.Item value={choice} label={choice}>{choice}</Select.Item
                >
              {/each}
            </Select.Content>
          </Select.Root>
        </div>
      {/if}
      {#if (action === "add" || action === "definition") && (type === "array" || additionalTypes.includes("array"))}
        <div class="editor-dialog-field">
          <Label for={`${id}-items`}>{i18n.t("Array item type")}</Label>
          <Select.Root type="single" bind:value={itemType}>
            <Select.Trigger
              id={`${id}-items`}
              aria-label={i18n.t("Array item type")}>{itemType}</Select.Trigger
            >
            <Select.Content portalProps={{ disabled: true }}
              >{#each choices.filter((choice) => choice !== "array") as choice}<Select.Item
                  value={choice}
                  label={choice}>{choice}</Select.Item
                >{/each}</Select.Content
            >
          </Select.Root>
        </div>
      {/if}
      {#if error}<p role="alert">{error}</p>{/if}
      <Dialog.Footer
        ><Button type="button" variant="outline" onclick={() => (open = false)}
          >{i18n.t("Cancel")}</Button
        ><Button type="submit" disabled={session.locked}
          >{i18n.t(action === "delete" ? "Delete" : "Save")}</Button
        ></Dialog.Footer
      >
    </form>
  </Dialog.Content>
</Dialog.Root>
