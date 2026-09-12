<script lang="ts">
  import RuleIndicator from "./RuleIndicator.svelte";
  import Button from "@jsonforms-svelte-shadcn-ui/button/button.svelte";
  import { dragHandle } from "svelte-dnd-action";
  import NodeActions from "./NodeActions.svelte";
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
  const path = $derived(pathFor(session.layout, id));
  const container = $derived(containers.has(node.type));
  const items = $derived(session.items(node));
  const active = $derived(
    items.find((item) => item.id === activeId) ?? items[0],
  );
  $effect(() => {
    const selected = session.selected;
    if (
      path &&
      node.type === "Categorization" &&
      selected.length > path.length &&
      path.every((part, index) => selected[index] === part)
    ) {
      activeId = items[selected[path.length]]?.id;
    }
  });
  const sample = $derived({
    ...session.document,
    uischemas: [],
    uischema: { ...node, rule: undefined } as unknown as Node,
  });
</script>

<!-- The frame extends the nested selection buttons' pointer target; those buttons provide keyboard access. -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  role="group"
  tabindex="-1"
  onclick={(event) => {
    event.stopPropagation();
    if (path) session.select(path);
  }}
  onkeydown={(event) => {
    if (
      event.target === event.currentTarget &&
      (event.key === "Enter" || event.key === " ")
    ) {
      event.preventDefault();
      event.stopPropagation();
      if (path) session.select(path);
    }
  }}
  class="design-node"
  class:selected={!session.unplacedSchemaSelection &&
    path !== undefined &&
    elementId(session.node) === id}
  class:layout-node={container}
>
  <div class="node-heading">
    <span use:dragHandle aria-label={`Drag ${String(node.label || node.type)}`}
      >⠿</span
    ><Button
      variant="ghost"
      class="node-select"
      onclick={() => {
        if (path) session.select(path);
      }}
      >{String(node.label || node.type)}</Button
    >
    {#if Object.hasOwn(node, "rule") && path}<RuleIndicator {session} {path} />{/if}
    {#if path?.length}<NodeActions
        {session}
        elementId={id}
        label={String(node.label ?? node.scope ?? node.type)}
      />{/if}
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
        >{#snippet children(item)}<div
            class="palette-row category-row"
            class:selected={JSON.stringify(session.selected) ===
              JSON.stringify(pathFor(session.layout, item.id))}
          >
            <span use:dragHandle aria-label={`Drag tab ${item.label}`}>⠿</span
            ><Button
              variant="ghost"
              class="category-tab"
              aria-pressed={item.id === active?.id}
              onpointerenter={() => {
                if (session.dragging) activeId = item.id;
              }}
              onclick={() => {
                activeId = item.id;
                const p = pathFor(session.layout, item.id);
                if (p) session.select(p);
              }}>{item.label}</Button
            >
            <NodeActions
              {session}
              elementId={item.id}
              label={`tab ${item.label}`}
            />
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
    <Button
      variant="ghost"
      class="drop-zone"
      disabled={session.locked}
      onclick={() => {
        if (path) session.select(path);
      }}
      >{node.type === "Categorization"
        ? "Select to add a tab"
        : "Select this layout to add elements"}</Button
    >
  {:else if node.type === "Control" && !hasScope(session.document.schema, node.scope)}<p
      class="notice"
    >
      Unresolved binding: {String(node.scope)}. Restore the schema property or
      remove/rebind this control in Source.
    </p>
  {:else if ["Control", "Label", "Button", "Separator", "Spacer", "ImageView"].includes(node.type) && previewSafe(node)}<Button
      variant="ghost"
      class="sample-select"
      aria-label={`Select ${String(node.label ?? node.scope ?? node.type)}`}
      onclick={() => {
        if (path) session.select(path);
      }}
      ><span inert class="runtime-sample"
        >{#key JSON.stringify( [sample.schema, sample.uischema, sample.uischemas], )}<Runtime
            form={sample}
            {mode}
            design
          />{/key}</span
      ></Button
    >
  {:else}<p class="muted">
      {node.type} · Advanced element preserved. Visual editing is not available yet.
    </p>{/if}
</div>
