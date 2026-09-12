<script lang="ts">
  import { dragHandle } from "svelte-dnd-action";
  import DragZone from "../dnd/DragZone.svelte";
  import { fields } from "../document/commands/index.js";
  import type { EditorSession } from "../document/history-store.svelte.js";
  import type { DragItem } from "../dnd/payloads.js";
  let { session }: { session: EditorSession } = $props();
  const items = $derived<DragItem[]>(
    [{ name: "(root)", scope: "#" }, ...fields(session.document.schema)].map(
      (field) => ({
        id: `${session.dragType}:field:${field.scope}`,
        label: field.name,
        payload: { kind: "schema-property", pointer: field.scope },
      }),
    ),
  );
</script>

<aside aria-label="Schema tree">
  <h2>Schema tree</h2>
  <p class="muted">Drag a field, or click to bind it in the selected layout.</p>
  <DragZone {session} sourceItems={items} label="Schema fields" handles
    >{#snippet children(item)}{#if item.payload.kind === "schema-property"}<div
          class="palette-row"
        >
          <span use:dragHandle aria-label={`Drag field ${item.label}`}>⠿</span
          ><button
            class="palette-button schema-row"
            title={item.payload.pointer}
            style:padding-inline-start={`${Math.max(0, (item.payload.pointer.split("/").length - 3) / 2) * 12 + 8}px`}
            disabled={session.locked}
            onclick={() =>
              item.payload.kind === "schema-property" &&
              session.bind(item.payload.pointer)}>{item.label}</button
          >
        </div>{/if}{/snippet}</DragZone
  >
</aside>
