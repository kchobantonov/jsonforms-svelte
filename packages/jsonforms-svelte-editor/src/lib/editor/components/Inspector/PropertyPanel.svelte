<script lang="ts">
  import { useEditorI18n } from "../../i18n/context.js";
  const i18n = useEditorI18n();
  import { setContext } from "svelte";
  import { ruleEditorContext, ruleEditorMode } from "../../rules/context.js";
  import OccurrenceSelect from "./OccurrenceSelect.svelte";
  import Inspector from "./Inspector.svelte";
  import PanelHeading from "../workspace/PanelHeading.svelte";
  import type { EditorSession } from "../../document/history-store.svelte.js";
  let { session, mode = "system" }: { session: EditorSession; mode?: string } = $props();
  setContext(ruleEditorContext, () => session);
  setContext(ruleEditorMode, () => mode);
</script>

<aside aria-label={i18n.t("Properties")}>
  <PanelHeading title="Properties" />
  {#if session.unplacedSchemaSelection}
    <h2>{i18n.t("Schema field")}</h2>
    <p>{session.unplacedSchemaSelection}</p>
    <div>
      <Inspector
        focusRevision={session.ruleFocus}
        locked={session.locked}
        document={session.document}
        node={{ type: "Control", scope: session.unplacedSchemaSelection }}
        onchange={session.inspectSchema}
        schemaOnly
      />
    </div>
  {:else}
    <OccurrenceSelect {session} />
    <h2>{session.node.type} {i18n.t("properties")}</h2>
    <p class="muted">{i18n.t("Changes update the form model.")}</p>
    <div>
      <Inspector
        focusRevision={session.ruleFocus}
        locked={session.locked}
        document={session.document}
        node={session.node}
        onchange={session.inspect}
      />
    </div>
  {/if}
</aside>
