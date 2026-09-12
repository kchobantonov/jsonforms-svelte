<script lang="ts">
  import { getContext, onDestroy } from "svelte";
  import { ruleEditorContext, ruleEditorMode } from "../../rules/context.js";
  import type { EditorSession } from "../../document/history-store.svelte.js";
  import { ruleSchema, validateRule, visualRule } from "../../rules/model.js";
  import { object, fields } from "../../document/commands/index.js";
  import { useEditorI18n } from "../../i18n/context.js";
  import Button from "@jsonforms-svelte-shadcn-ui/button/button.svelte";
  import Toggle from "@jsonforms-svelte-shadcn-ui/toggle/toggle.svelte";
  import IconAction from "../shared/IconAction.svelte";
  import Check from "@lucide/svelte/icons/check";
  import Undo2 from "@lucide/svelte/icons/undo-2";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import { ruleMatch } from "../../rules/evaluation.js";
  import RuleVisual from "./RuleVisual.svelte";
  const session = getContext<() => EditorSession>(ruleEditorContext)();
  const editorMode = getContext<() => string>(ruleEditorMode);
  const i18n = useEditorI18n();
  const source = import("../MonacoPane.svelte");
  let editing = $state(false),
    json = $state(false),
    text = $state(""),
    error = $state("");
  let root = $state<HTMLDivElement>();
  const parsed = $derived.by(() => {
    try {
      return JSON.parse(text);
    } catch {
      return undefined;
    }
  });
  function change(value: unknown) {
    text = JSON.stringify(value, null, 2);
    editing = true;
    session.setRuleDraft(true);
  }
  function begin() {
    change(
      session.node.rule ?? {
        effect: "SHOW",
        condition: {
          scope: fields(session.document.schema)[0]?.scope ?? "#",
          schema: { const: "" },
          failWhenUndefined: true,
        },
      },
    );
    json = !visualRule(parsed);
  }
  function revert() {
    editing = false;
    error = "";
    session.setRuleDraft(false);
  }
  function apply() {
    try {
      validateRule(parsed);
      session.saveRule(parsed);
      editing = false;
      error = "";
    } catch (reason) {
      error = i18n.t(reason instanceof Error ? reason.message : String(reason));
    }
  }
  $effect(() => {
    if (session.ruleFocus) {
      root?.scrollIntoView({ block: "nearest" });
      root?.querySelector<HTMLButtonElement>("button")?.focus();
    }
  });
  onDestroy(() => {
    if (editing) session.setRuleDraft(false);
  });
</script>

<div bind:this={root} data-rule-editor>
  {#if !editing}
    {#if session.node.rule}<p>
        {i18n.t("Rule")}: {String(object(session.node.rule).effect)}
      </p>{/if}
    {#if session.node.rule}<p>
        {i18n.t("Preview condition")}: {i18n.t(
          ruleMatch(
            session.node.rule,
            session.previewData,
            session.document.config,
          ),
        )}
      </p>{/if}
    <Button variant="outline" disabled={session.locked} onclick={begin}
      >{i18n.t(session.node.rule ? "Edit rule" : "Add rule")}</Button
    >
    {#if session.node.rule}<IconAction
        label={i18n.t("Remove rule")}
        disabled={session.locked}
        onclick={() => session.saveRule(undefined)}
        ><Trash2 size={16} /></IconAction
      >{/if}
  {:else}
    <div class="panel-actions">
      <IconAction label={i18n.t("Apply rule")} onclick={apply}
        ><Check size={16} /></IconAction
      >
      <IconAction label={i18n.t("Revert rule")} onclick={revert}
        ><Undo2 size={16} /></IconAction
      >
      <Toggle pressed={json} onPressedChange={(value) => (json = value)}
        >{i18n.t("JSON")}</Toggle
      >
    </div>
    {#if json}
      <div class="rule-source">
        {#await source}<p>
            {i18n.t("Loading Monaco…")}
          </p>{:then module}<module.default
            value={text}
            schema={ruleSchema}
            mode={editorMode()}
            onchange={(value) => (text = value)}
          />{/await}
      </div>
    {:else}<RuleVisual
        rule={parsed}
        schema={session.document.schema}
        onchange={change}
      />{/if}
    {#if error}<p role="alert">{error}</p>{/if}
  {/if}
</div>
