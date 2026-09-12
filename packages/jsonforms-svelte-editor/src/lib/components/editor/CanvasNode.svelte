<script lang="ts">
  import CanvasNode from "./CanvasNode.svelte";
  import Runtime from "./Runtime.svelte";
  import {
    containers,
    hasScope,
    previewSafe,
    type Node,
    type Document,
  } from "../../document/commands.js";
  let {
    node,
    path,
    document,
    selected,
    mode,
    locked,
    onselect,
    ondropnode,
  }: {
    node: Node;
    path: number[];
    document: Document;
    selected: string;
    mode: string;
    locked: boolean;
    onselect: (path: number[]) => void;
    ondropnode: (event: DragEvent, path: number[]) => void;
  } = $props();
  let tab = $state(0);
  const container = $derived(containers.has(node.type));
  const sample = $derived({
    ...document,
    uischemas: [],
    uischema: { ...node, rule: undefined } as unknown as Document["uischema"],
  });
  const active = $derived(
    Math.min(tab, Math.max(0, (node.elements?.length ?? 1) - 1)),
  );
</script>

<div
  class:selected={selected === JSON.stringify(path)}
  class="design-node"
  class:layout-node={container}
>
  <div class="node-heading">
    <button
      class="node-select"
      onclick={() => onselect(path)}
      draggable={!locked && path.length > 0}
      ondragstart={(event) => {
        event.stopPropagation();
        event.dataTransfer?.setData(
          "application/json",
          JSON.stringify({ kind: "move", path }),
        );
      }}
      >{String(node.label || node.type)}{#if node.rule}<span class="badge">
          · Rule</span
        >{/if}</button
    >
  </div>
  {#if container}
    {#if node.type === "Categorization"}
      <div class="design-tabs" role="tablist" aria-label="Categories">
        {#each node.elements ?? [] as category, index}<button
            role="tab"
            aria-selected={index === active}
            onclick={() => {
              tab = index;
              onselect([...path, index]);
            }}
            ondragenter={() => (tab = index)}
            >{String(category.label ?? `Tab ${index + 1}`)}</button
          >{/each}
      </div>
      {#if node.elements?.[active]}<CanvasNode
          node={node.elements[active]}
          path={[...path, active]}
          {document}
          {selected}
          {mode}
          {locked}
          {onselect}
          {ondropnode}
        />{/if}
    {:else}<div class:horizontal={node.type === "HorizontalLayout"}>
        {#each node.elements ?? [] as child, index}<CanvasNode
            node={child}
            path={[...path, index]}
            {document}
            {selected}
            {mode}
            {locked}
            {onselect}
            {ondropnode}
          />{/each}
      </div>{/if}
    <button
      class="drop-zone"
      disabled={locked}
      ondragover={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      ondrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        ondropnode(event, path);
      }}
      onclick={() => onselect(path)}
      >{node.type === "Categorization"
        ? "Select to add a tab"
        : "Drop here or select this layout to add elements"}</button
    >
  {:else if node.type === "Control" && !hasScope(document.schema, node.scope)}
    <p class="notice">
      Unresolved binding: {String(node.scope)}. Restore the schema property or
      remove/rebind this control in Source.
    </p>
  {:else if ["Control", "Label"].includes(node.type) && previewSafe(node)}
    <button
      class="sample-select"
      aria-label={`Select ${String(node.label ?? node.scope ?? node.type)}`}
      onclick={() => onselect(path)}
      ><span inert class="runtime-sample"><Runtime form={sample} {mode} /></span
      ></button
    >
  {:else}<p class="muted">
      {node.type} · Advanced element preserved. Visual editing is not available yet.
    </p>{/if}
</div>
