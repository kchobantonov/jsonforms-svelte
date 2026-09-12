<script lang="ts">
  import { dragHandle } from "svelte-dnd-action";
  import DragZone from "../dnd/DragZone.svelte";
  import { presets } from "../registrations/control-definitions.js";
  import type { EditorSession } from "../document/history-store.svelte.js";
  import type { DragItem } from "../dnd/payloads.js";
  let { session }: { session: EditorSession } = $props();
  const items = $derived<DragItem[]>(
    presets.map((preset) => ({
      id: `${session.dragType}:palette:${preset}`,
      label: preset,
      payload: { kind: "palette-item", preset },
    })),
  );
  const categories = $derived<DragItem[]>([
    {
      id: `${session.dragType}:palette:Category`,
      label: "Category",
      payload: { kind: "palette-item", preset: "Category" },
    },
  ]);
</script>

<aside aria-label="Components">
  <h2>Add element</h2>
  <p class="muted">Select a layout, then click or drag.</p>
  <DragZone {session} sourceItems={items} label="Component palette" handles
    >{#snippet children(item)}<div class="palette-row">
        <span use:dragHandle aria-label={`Drag ${item.label}`}>⠿</span><button
          class="palette-button"
          disabled={session.locked}
          onclick={() => session.add(item.label)}>{item.label}</button
        >
      </div>{/snippet}</DragZone
  ><DragZone
    {session}
    sourceItems={categories}
    group="categories"
    label="Category palette"
    handles
    >{#snippet children(item)}<div class="palette-row">
        <span use:dragHandle aria-label={`Drag ${item.label}`}>⠿</span><button
          class="palette-button"
          disabled={session.locked}
          onclick={() => session.add(item.label)}>{item.label}</button
        >
      </div>{/snippet}</DragZone
  >
</aside>
