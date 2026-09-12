<script lang="ts">
  import { dragHandle } from "svelte-dnd-action";
  import CanvasNode from "./CanvasNode.svelte";
  import Runtime from "../preview/Runtime.svelte";
  import DragZone from "../../dnd/DragZone.svelte";
  import { elementId } from "../../document/identity.js";
  import { pathFor } from "../../dnd/drop-handler.js";
  import {
    containers,
    hasScope,
    previewSafe,
    type Node,
  } from "../../document/commands/index.js";
  import type { EditorSession } from "../../document/history-store.svelte.js";
  let {
    node,
    session,
    mode,
  }: { node: Node; session: EditorSession; mode: string } = $props();
  let activeId = $state<string | undefined>();
  const id = $derived(elementId(node));
  const path = $derived(pathFor(session.document.uischema, id) ?? []);
  const container = $derived(containers.has(node.type));
  const items = $derived(session.items(node));
  const active = $derived(
    items.find((item) => item.id === activeId) ?? items[0],
  );
  const sample = $derived({
    ...session.document,
    uischemas: [],
    uischema: { ...node, rule: undefined } as unknown as Node,
  });
</script>

<div
  class="design-node"
  class:selected={JSON.stringify(session.selected) === JSON.stringify(path)}
  class:layout-node={container}
>
  <div class="node-heading">
    <span use:dragHandle aria-label={`Drag ${String(node.label || node.type)}`}
      >⠿</span
    ><button class="node-select" onclick={() => session.select(path)}
      >{String(node.label || node.type)}{#if node.rule}<span class="badge">
          · Rule</span
        >{/if}</button
    >
  </div>
  {#if container}
    {#if node.type === "Categorization"}
      <DragZone
        {session}
        sourceItems={items}
        targetId={id}
        group="categories"
        label="Categories"
        handles
        horizontal
        >{#snippet children(item)}<div class="palette-row">
            <span use:dragHandle aria-label={`Drag tab ${item.label}`}>⠿</span
            ><button
              class="category-tab"
              aria-pressed={item.id === active?.id}
              onpointerenter={() => {
                if (session.dragging) activeId = item.id;
              }}
              onclick={() => {
                activeId = item.id;
                const p = pathFor(session.document.uischema, item.id);
                if (p) session.select(p);
              }}>{item.label}</button
            >
          </div>{/snippet}</DragZone
      >
      {#if active?.node}<CanvasNode node={active.node} {session} {mode} />{/if}
    {:else}<DragZone
        {session}
        sourceItems={items}
        targetId={id}
        label={`${String(node.label || node.type)} children`}
        handles
        horizontal={node.type === "HorizontalLayout"}
        >{#snippet children(item)}{#if item.node}<CanvasNode
              node={item.node}
              {session}
              {mode}
            />{:else}<div class="drag-placeholder">
              {item.label}
            </div>{/if}{/snippet}</DragZone
      >{/if}
    <button
      class="drop-zone"
      disabled={session.locked}
      onclick={() => session.select(path)}
      >{node.type === "Categorization"
        ? "Select to add a tab"
        : "Select this layout to add elements"}</button
    >
  {:else if node.type === "Control" && !hasScope(session.document.schema, node.scope)}<p
      class="notice"
    >
      Unresolved binding: {String(node.scope)}. Restore the schema property or
      remove/rebind this control in Source.
    </p>
  {:else if ["Control", "Label"].includes(node.type) && previewSafe(node)}<button
      class="sample-select"
      aria-label={`Select ${String(node.label ?? node.scope ?? node.type)}`}
      onclick={() => session.select(path)}
      ><span inert class="runtime-sample"><Runtime form={sample} {mode} /></span
      ></button
    >
  {:else}<p class="muted">
      {node.type} · Advanced element preserved. Visual editing is not available yet.
    </p>{/if}
</div>
