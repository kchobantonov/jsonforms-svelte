<script lang="ts">
  import {
    dndzone,
    dragHandleZone,
    TRIGGERS,
    type DndEvent,
  } from "svelte-dnd-action";
  import { untrack, type Snippet } from "svelte";
  import type { DragItem } from "./payloads.js";
  import type { EditorSession } from "../document/history-store.svelte.js";
  let {
    session,
    sourceItems,
    targetId,
    group = "elements",
    label,
    handles = false,
    horizontal = false,
    autoAriaDisabled = false,
    children,
  }: {
    session: EditorSession;
    sourceItems: DragItem[];
    targetId?: string;
    group?: string;
    label: string;
    handles?: boolean;
    horizontal?: boolean;
    autoAriaDisabled?: boolean;
    children: Snippet<[DragItem]>;
  } = $props();
  let items = $state.raw<DragItem[]>([]);
  $effect(() => {
    session.revision;
    items = sourceItems;
  });
  const disabled = $derived(
    session.locked ||
      !targetId ||
      (session.dragging
        ? !session.canDrop(session.dragging.payload, targetId)
        : false),
  );
  const options = $derived({
    items,
    autoAriaDisabled,
    type: `${session.dragType}:${group}`,
    dragDisabled: session.locked,
    dropFromOthersDisabled: disabled,
    flipDurationMs: 0,
    dropAnimationDisabled: true,
    useCursorForDetection: true,
    // The library applies this to EVERY eligible zone, not just the hovered
    // target. Keep selection styling distinct; the shadow item marks insertion.
    dropTargetStyle: {},
  });
  const action = untrack(() => (handles ? dragHandleZone : dndzone));
  function consider(event: CustomEvent<DndEvent<DragItem>>) {
    event.stopPropagation();
    const { items: next, info } = event.detail;
    if (info.trigger === TRIGGERS.DRAG_STARTED)
      session.dragging = next.find((item) => item.id === info.id);
    if (info.trigger === TRIGGERS.DRAG_STOPPED) session.dragging = undefined;
    items = next;
  }
  function finalize(event: CustomEvent<DndEvent<DragItem>>) {
    event.stopPropagation();
    const { items: next, info } = event.detail;
    items = next;
    const index = next.findIndex((item) => item.id === info.id);
    const item = next[index];
    if (
      targetId &&
      item &&
      (info.trigger === TRIGGERS.DROPPED_INTO_ZONE ||
        info.trigger === TRIGGERS.DRAG_STOPPED)
    )
      session.finalizeDrop(item.payload, targetId, index);
    if (info.trigger !== TRIGGERS.DROPPED_INTO_ANOTHER)
      session.dragging = undefined;
    items = sourceItems;
  }
</script>

<div
  class="drag-zone"
  class:horizontal
  use:action={options}
  onconsider={consider}
  onfinalize={finalize}
  aria-label={label}
  data-drop-target={targetId}
>
  {#each items as item (item.id)}<div
      class="drag-item"
      data-is-dnd-shadow-item-hint={item.isDndShadowItem || undefined}
      aria-label={item.label}
    >
      {#if item.isDndShadowItem}<div class="drag-placeholder">
          {item.label}
        </div>{:else}{@render children(item)}{/if}
    </div>{/each}
</div>
