<script lang="ts">
  import PanelHeading from "./PanelHeading.svelte";
  import IconAction from "../shared/IconAction.svelte";
  import Check from "@lucide/svelte/icons/check";
  import Undo2 from "@lucide/svelte/icons/undo-2";
  import { useEditorI18n } from "../../i18n/context.js";
  const i18n = useEditorI18n();
  import type { JsonValue } from "../../document/types.js";
  let {
    title,
    oncollapse,
    value,
    schema,
    mode,
    readonly = false,
    onchange,
  }: {
    title: string;
    oncollapse: () => void;
    value: JsonValue;
    schema: Record<string, unknown>;
    mode: string;
    readonly?: boolean;
    onchange?: (value: JsonValue) => void;
  } = $props();
  const source = import("../MonacoPane.svelte");
  let text = $state(""),
    dirty = $state(false),
    error = $state("");
  function apply() {
    try {
      onchange?.(JSON.parse(text));
      dirty = false;
      error = "";
    } catch (reason) {
      error = String(reason);
    }
  }
</script>

<PanelHeading {title} {oncollapse}>
  <div class="data-panel-actions">
    {#if !readonly}
      <IconAction
        label={i18n.t("Apply input")}
        disabled={!dirty}
        onclick={apply}><Check size={16} /></IconAction
      >
      <IconAction
        label={i18n.t("Revert input")}
        disabled={!dirty}
        onclick={() => {
          dirty = false;
          error = "";
        }}><Undo2 size={16} /></IconAction
      >
    {/if}
  </div>
</PanelHeading>
{#await source}<p>{i18n.t("Loading Monaco…")}</p>{:then module}
  <module.default
    value={dirty ? text : JSON.stringify(value, null, 2)}
    sync={!dirty}
    {schema}
    {mode}
    readOnly={readonly}
    onchange={(value) => {
      text = value;
      dirty = true;
    }}
  />
{/await}
{#if error}<p role="alert">{error}</p>{/if}
