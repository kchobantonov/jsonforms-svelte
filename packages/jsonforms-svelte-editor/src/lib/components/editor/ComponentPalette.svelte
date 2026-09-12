<script lang="ts">
  import { fields } from "../../document/commands.js";
  import type { EditorSession } from "../../state/session.svelte.js";
  let { session }: { session: EditorSession } = $props();
  const available = $derived(fields(session.document.schema));
</script>

<aside aria-label="Components">
  <h2>Add element</h2>
  <p class="muted">Select a layout, then click or drag.</p>
  <div class="palette">
    {#each ["text", "textarea", "number", "checkbox", "VerticalLayout", "HorizontalLayout", "Group", "Categorization", "Category"] as preset}<button
        disabled={session.locked}
        draggable={!session.locked}
        ondragstart={(event) =>
          event.dataTransfer?.setData(
            "application/json",
            JSON.stringify({ kind: "preset", preset }),
          )}
        onclick={() => session.add(preset)}>{preset}</button
      >{/each}
  </div>
  <h2>Schema fields</h2>
  <div class="palette">
    {#each available as field}<button
        title={field.scope}
        disabled={session.locked}
        draggable={!session.locked}
        ondragstart={(event) =>
          event.dataTransfer?.setData(
            "application/json",
            JSON.stringify({ kind: "field", scope: field.scope }),
          )}
        onclick={() => session.bind(field.scope)}>{field.name}</button
      >{/each}
  </div>
</aside>
