<script lang="ts">
  import SchemaActions from "./SchemaActions.svelte";
  import { dragHandle } from "svelte-dnd-action";
  import Button from "@jsonforms-svelte-shadcn-ui/button/button.svelte";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import SchemaBranch from "./SchemaBranch.svelte";
  import DragZone from "../../dnd/DragZone.svelte";
  import type { SchemaTreeNode } from "../../document/schema-tree.js";
  import type { EditorSession } from "../../document/history-store.svelte.js";
  import type { SchemaTreeState } from "./tree-state.svelte.js";
  import type { DragItem } from "../../dnd/payloads.js";
  let {
    node,
    session,
    tree,
    level = 1,
    parent,
  }: {
    node: SchemaTreeNode;
    session: EditorSession;
    tree: SchemaTreeState;
    level?: number;
    parent?: string;
  } = $props();
  const expanded = $derived(tree.isExpanded(node.pointer));
  const childItems = $derived<DragItem[]>(
    node.children.map((child) => ({
      id: `${session.dragType}:field:${child.pointer}`,
      label: child.label,
      payload: { kind: "schema-property", pointer: child.pointer },
      schemaNode: child,
    })),
  );
  function keyboard(event: KeyboardEvent) {
    if (event.target !== event.currentTarget) return;
    if (
      [
        "ArrowDown",
        "ArrowUp",
        "ArrowLeft",
        "ArrowRight",
        "Home",
        "End",
      ].includes(event.key)
    ) {
      event.preventDefault();
      event.stopPropagation();
      tree.navigate(node, event.key, parent);
    }
    if (event.key === "Enter") {
      event.preventDefault();
      session.selectSchema(node.pointer);
    }
  }
</script>

<div
  role="treeitem"
  aria-label={node.label}
  aria-selected={(session.schemaSelection ?? session.node.scope) ===
    node.pointer}
  aria-level={level}
  aria-expanded={node.children.length ? expanded : undefined}
  tabindex={tree.focused === node.pointer ? 0 : -1}
  use:tree.register={node.pointer}
  onfocus={(event) => {
    if (event.target === event.currentTarget) tree.focusedOn(node.pointer);
  }}
  onkeydown={keyboard}
  data-schema-pointer={node.pointer}
>
  <div class="schema-tree-row">
    {#if node.children.length}<Button
        variant="ghost"
        size="icon"
        tabindex={-1}
        aria-label={`${expanded ? "Collapse" : "Expand"} ${node.label}`}
        onclick={() => tree.toggle(node)}
        ><ChevronRight
          size={14}
          class={expanded ? "tree-expanded" : ""}
        /></Button
      >{:else}<span class="tree-toggle-spacer"></span>{/if}
    {#if node.bindable}<span
        use:dragHandle
        aria-label={`Drag field ${node.label}`}>⠿</span
      >{:else}<span
        class="tree-toggle-spacer"
        title={node.pointer.includes("/items") ||
        node.pointer.includes("/prefixItems")
          ? "Bind the array itself; per-item layout authoring is planned."
          : undefined}
      ></span>{/if}
    <Button
      variant="ghost"
      tabindex={-1}
      class="schema-tree-label"
      title={node.pointer}
      aria-label={node.label}
      onclick={() => session.selectSchema(node.pointer)}
      ><span>{node.label}</span><span class="schema-type" aria-hidden="true"
        >{node.type}</span
      ></Button
    >
    <SchemaActions {node} {session} />
  </div>
  {#if expanded && childItems.length}<div
      role="group"
      class="schema-tree-children"
    >
      <DragZone
        {session}
        sourceItems={childItems}
        label={`${node.label} fields`}
        autoAriaDisabled
        handles
        >{#snippet children(item)}{#if item.schemaNode}<SchemaBranch
              node={item.schemaNode}
              {session}
              {tree}
              level={level + 1}
              parent={node.pointer}
            />{/if}{/snippet}</DragZone
      >
    </div>{/if}
</div>
