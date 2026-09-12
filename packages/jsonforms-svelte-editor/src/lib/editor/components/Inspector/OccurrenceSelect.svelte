<script lang="ts">
  import * as Select from "@jsonforms-svelte-shadcn-ui/select/index.js";
  import { getContext } from "svelte";
  import { editorPortalTarget } from "../../portal-context.js";
  import { schemaOccurrences } from "../../document/schema-usage.js";
  import { useEditorI18n } from "../../i18n/context.js";
  import type { EditorSession } from "../../document/history-store.svelte.js";
  let { session }: { session: EditorSession } = $props();
  const i18n = useEditorI18n();
  const target = getContext<() => HTMLElement | undefined>(editorPortalTarget);
  const matches = $derived(
    schemaOccurrences(session.layout).filter(
      (item) => item.scope === session.node.scope,
    ),
  );
  const value = $derived(JSON.stringify(session.selected));
</script>

{#if matches.length > 1}
  <p class="muted">
    {i18n.t(
      "This field has multiple controls. Choose which placement to edit. Schema properties are shared; UI options belong to the selected placement.",
    )}
  </p>
  <Select.Root
    type="single"
    {value}
    onValueChange={(value) => {
      const match = matches.find((item) => JSON.stringify(item.path) === value);
      if (match) session.select(match.path);
    }}
  >
    <Select.Trigger aria-label={i18n.t("Control placement")}
      >{matches.find((item) => JSON.stringify(item.path) === value)
        ?.label}</Select.Trigger
    >
    <Select.Content portalProps={{ to: target?.() }}>
      {#each matches as item}<Select.Item
          value={JSON.stringify(item.path)}
          label={item.label}>{item.label}</Select.Item
        >{/each}
    </Select.Content>
  </Select.Root>
{/if}
