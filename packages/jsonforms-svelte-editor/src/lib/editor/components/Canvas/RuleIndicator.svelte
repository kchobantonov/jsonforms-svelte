<script lang="ts">
  import GitBranch from "@lucide/svelte/icons/git-branch";
  import IconAction from "../shared/IconAction.svelte";
  import { useEditorI18n } from "../../i18n/context.js";
  import type { EditorSession } from "../../document/history-store.svelte.js";
  const i18n = useEditorI18n();
  let { session, path }: { session: EditorSession; path: number[] } = $props();
</script>

<IconAction
  label={i18n.t("Edit rule")}
  disabled={session.locked}
  onclick={() => session.openRule(path)}><GitBranch size={14} /></IconAction
>
