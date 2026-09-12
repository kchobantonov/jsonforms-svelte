<script lang="ts">
  import Button from "../ui/button/button.svelte";
  import type { EditorSession } from "../../state/session.svelte.js";
  let {
    session,
    title,
    source,
    preview,
    ontoggleSource,
    ontogglePreview,
  }: {
    session: EditorSession;
    title: string;
    source: boolean;
    preview: boolean;
    ontoggleSource: () => void;
    ontogglePreview: () => void;
  } = $props();
</script>

<header>
  <div>
    <span class="eyebrow">JSON Forms editor</span>
    <h1>{title}</h1>
  </div>
  <div class="toolbar">
    <Button
      variant="outline"
      disabled={!session.canUndo}
      onclick={() => session.undo()}>Undo</Button
    ><Button
      variant="outline"
      disabled={!session.canRedo}
      onclick={() => session.undo(true)}>Redo</Button
    ><Button variant="outline" aria-pressed={source} onclick={ontoggleSource}
      >Model</Button
    ><Button variant="outline" aria-pressed={preview} onclick={ontogglePreview}
      >Preview</Button
    >
  </div>
</header>
