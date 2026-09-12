<script lang="ts">
  import Button from "@jsonforms-svelte-shadcn-ui/button/button.svelte";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import type { EditorSession } from "../../document/history-store.svelte.js";
  let {
    session,
    elementId,
    label,
  }: { session: EditorSession; elementId: string; label: string } = $props();
</script>

<div class="canvas-node-actions">
  <Button
    variant="ghost"
    size="icon"
    aria-label={`Remove ${label}`}
    title="Remove from layout"
    disabled={session.locked}
    onclick={(event) => {
      event.stopPropagation();
      session.removeElement(elementId);
    }}
  >
    <Trash2 size={14} aria-hidden="true" />
  </Button>
</div>
